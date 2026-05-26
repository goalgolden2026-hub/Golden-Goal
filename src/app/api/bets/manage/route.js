import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Simulate SPL Token Balance Check (In Production, use Solana web3.js + getAccountInfo)
async function getTokenBalance(walletAddress) {
    // Demo implementation: We assume everyone has 30,000 tokens for testing.
    return 30000;
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { walletAddress, betId, action, newPrediction } = body;

        if (!walletAddress || !betId || !action) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const sql = await getDb();
        
        // 1. Check Token Balance
        const balance = await getTokenBalance(walletAddress);

        // 2. Fetch Bet and Market Data
        const betRes = await sql`
            SELECT b.*, m."matchDate" 
            FROM bets b
            JOIN markets m ON b."marketId" = m.id
            WHERE b.id = ${betId} AND b."walletAddress" = ${walletAddress}
        `;
        if (betRes.rowCount === 0) {
            return NextResponse.json({ success: false, error: "Bet not found or unauthorized" }, { status: 404 });
        }
        
        const bet = betRes.rows[0];

        if (bet.status !== 'PENDING') {
            return NextResponse.json({ success: false, error: "Only active (pending) predictions can be modified" }, { status: 400 });
        }

        // 3. Check Time Lockout (must be at least 5 mins before matchDate)
        const matchTime = new Date(bet.matchDate).getTime();
        const nowTime = Date.now();
        const fiveMinsInMs = 5 * 60 * 1000;

        if (matchTime - nowTime < fiveMinsInMs) {
            return NextResponse.json({ success: false, error: "Modifications are locked! The match starts in less than 5 minutes or has already started." }, { status: 403 });
        }

        if (action === 'CHANGE') {
            if (balance < 100) {
                return NextResponse.json({ success: false, error: "Insufficient Token Balance (100 required)" }, { status: 403 });
            }
            if (!newPrediction) {
                return NextResponse.json({ success: false, error: "New prediction is required" }, { status: 400 });
            }
            
            // Log 100 tokens (50 BURN, 50 REWARD_POOL)
            await sql`INSERT INTO treasury_logs ("walletAddress", amount, type) VALUES (${walletAddress}, 50, 'BURN_CHANGE_BET')`;
            await sql`INSERT INTO treasury_logs ("walletAddress", amount, type) VALUES (${walletAddress}, 50, 'REWARD_POOL_CHANGE_BET')`;

            // Update bet
            await sql`UPDATE bets SET prediction = ${newPrediction} WHERE id = ${betId}`;
            
            return NextResponse.json({ success: true, message: "Prediction updated successfully. 100 Tokens deducted." });

        } else if (action === 'CANCEL') {
            if (balance < 200) {
                return NextResponse.json({ success: false, error: "Insufficient Token Balance (200 required)" }, { status: 403 });
            }

            // Log 200 tokens (100 BURN, 100 REWARD_POOL)
            await sql`INSERT INTO treasury_logs ("walletAddress", amount, type) VALUES (${walletAddress}, 100, 'BURN_CANCEL_BET')`;
            await sql`INSERT INTO treasury_logs ("walletAddress", amount, type) VALUES (${walletAddress}, 100, 'REWARD_POOL_CANCEL_BET')`;

            // Update bet status to CANCELED
            await sql`UPDATE bets SET status = 'CANCELED' WHERE id = ${betId}`;

            // Restore daily quota if bet was placed today
            // Note: Postgres CURRENT_TIMESTAMP can be compared with CURRENT_DATE
            await sql`
                UPDATE users 
                SET "betsToday" = GREATEST("betsToday" - 1, 0) 
                WHERE "walletAddress" = ${walletAddress} 
                AND EXISTS (
                    SELECT 1 FROM bets 
                    WHERE id = ${betId} AND DATE(timestamp) = CURRENT_DATE
                )
            `;

            return NextResponse.json({ success: true, message: "Prediction canceled successfully. 200 Tokens deducted and daily quota restored." });
        } else {
            return NextResponse.json({ success: false, error: "Invalid action specified" }, { status: 400 });
        }
        
    } catch (error) {
        console.error("PUT /api/bets/manage error:", error);
        return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 });
    }
}
