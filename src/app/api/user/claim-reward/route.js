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
        
        // 1. Fetch user to check points
        const userRes = await sql`SELECT * FROM users WHERE "walletAddress" = ${walletAddress}`;
        if (userRes.rowCount === 0) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        const user = userRes.rows[0];
        const points = user.referralPoints || 0;

        if (points < 1000) {
            return NextResponse.json({ success: false, error: "Insufficient referral points. 1000 points required." }, { status: 400 });
        }

        // 2. Deduct 1000 points
        await sql`
            UPDATE users 
            SET "referralPoints" = "referralPoints" - 1000 
            WHERE "walletAddress" = ${walletAddress}
        `;

        // 3. Log the Token Transfer in Treasury
        // Note: Real on-chain token transfer will be implemented in Phase 6.
        await sql`
            INSERT INTO treasury_logs ("walletAddress", amount, type) 
            VALUES (${walletAddress}, 1500, 'REFERRAL_REWARD')
        `;

        return NextResponse.json({ 
            success: true, 
            message: "1500 Golden Goal Tokens awarded successfully!"
        }, { status: 200 });

    } catch (error) {
        console.error("POST /api/user/claim-reward error:", error);
        return NextResponse.json({ success: false, error: "Failed to claim reward" }, { status: 500 });
    }
}
