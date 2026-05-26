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
        
        const activeStakeRes = await sql`SELECT * FROM stakes WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE'`;
        if (activeStakeRes.rowCount === 0) {
            return NextResponse.json({ success: false, error: "No active stake found." }, { status: 400 });
        }

        const stake = activeStakeRes.rows[0];
        let penaltyAmount = 0;

        // Check early unstake penalty
        if (stake.tier > 1 && stake.unlockDate) {
            const now = new Date();
            const unlock = new Date(stake.unlockDate);
            if (now < unlock) {
                // Early unstake! 10% penalty
                penaltyAmount = stake.amount * 0.10;
                
                // 50% Burn, 50% Treasury
                const burnAmount = penaltyAmount * 0.5;
                const treasuryAmount = penaltyAmount * 0.5;

                await sql`INSERT INTO treasury_logs ("walletAddress", amount, type) VALUES (${walletAddress}, ${burnAmount}, 'BURN')`;
                await sql`INSERT INTO treasury_logs ("walletAddress", amount, type) VALUES (${walletAddress}, ${treasuryAmount}, 'TREASURY')`;
            }
        }

        // Deactivate stake
        await sql`UPDATE stakes SET status = 'INACTIVE' WHERE id = ${stake.id}`;

        return NextResponse.json({ 
            success: true, 
            message: "Unstake successful", 
            penaltyApplied: penaltyAmount > 0,
            penaltyAmount,
            returnedAmount: stake.amount - penaltyAmount
        }, { status: 200 });

    } catch (error) {
        console.error("POST /api/unstake error:", error);
        return NextResponse.json({ success: false, error: "Failed to unstake" }, { status: 500 });
    }
}
