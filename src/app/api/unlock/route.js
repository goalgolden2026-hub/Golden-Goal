import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const { walletAddress } = body;

        if (!walletAddress) {
            return NextResponse.json({ success: false, error: "Missing walletAddress" }, { status: 400 });
        }

        const sql = await getDb();
        
        const activeLockRes = await sql`SELECT * FROM locks WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE'`;
        if (activeLockRes.rowCount === 0) {
            return NextResponse.json({ success: false, error: "No active lock found." }, { status: 400 });
        }

        const lock = activeLockRes.rows[0];
        let penaltyAmount = 0;

        // Check early unlock penalty
        if (lock.tier > 1 && lock.unlockDate) {
            const now = new Date();
            const unlock = new Date(lock.unlockDate);
            if (now < unlock) {
                // Early unlock! 10% penalty
                penaltyAmount = lock.amount * 0.10;
                
                // 50% Burn, 50% Treasury
                const burnAmount = penaltyAmount * 0.5;
                const treasuryAmount = penaltyAmount * 0.5;

                await sql`INSERT INTO treasury_logs ("walletAddress", amount, type) VALUES (${walletAddress}, ${burnAmount}, 'BURN')`;
                await sql`INSERT INTO treasury_logs ("walletAddress", amount, type) VALUES (${walletAddress}, ${treasuryAmount}, 'TREASURY')`;
            }
        }

        // Deactivate lock
        await sql`UPDATE locks SET status = 'INACTIVE' WHERE id = ${lock.id}`;

        return NextResponse.json({ 
            success: true, 
            message: "Unlock successful", 
            penaltyApplied: penaltyAmount > 0,
            penaltyAmount,
            returnedAmount: lock.amount - penaltyAmount
        }, { status: 200 });

    } catch (error) {
        console.error("POST /api/unlock error:", error);
        return NextResponse.json({ success: false, error: "Failed to unlock" }, { status: 500 });
    }
}
