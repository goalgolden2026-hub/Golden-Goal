import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Simulate SPL Token Balance Check (In Production, use Solana web3.js + getAccountInfo)
async function getTokenBalance(walletAddress) {
    try {
        const sql = await getDb();
        let mockBalance = 5000000; // Starts with 5,000,000 GG for demo testing
        
        // Deduct active locks
        const activeLocksTotalRes = await sql`SELECT SUM(amount) as total FROM locks WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE'`;
        if (activeLocksTotalRes.rows[0].total) {
            mockBalance -= parseInt(activeLocksTotalRes.rows[0].total);
        }
        
        // Apply treasury logs
        const logsRes = await sql`SELECT amount, type FROM treasury_logs WHERE "walletAddress" = ${walletAddress}`;
        for (const log of logsRes.rows) {
            const amt = parseFloat(log.amount);
            if (log.type.includes('BURN') || log.type.includes('REWARD_POOL') || log.type === 'TREASURY') {
                mockBalance -= amt;
            } else if (log.type === 'SPIN_PAYMENT') {
                mockBalance += amt;
            } else if (log.type === 'REFERRAL_REWARD' || log.type === 'SPIN_REWARD_GOLDEN') {
                mockBalance += amt;
            }
        }
        return mockBalance;
    } catch (err) {
        console.error("getTokenBalance error:", err);
        return 5000000;
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { walletAddress, betId, predictionId, action, newPrediction } = body;
        const finalPredictionId = predictionId || betId;

        if (!walletAddress || !finalPredictionId || !action) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const sql = await getDb();
        
        // 1. Check Token Balance
        const balance = await getTokenBalance(walletAddress);

        // 2. Fetch Prediction and Market Data
        const predictionRes = await sql`
            SELECT p.*, m."matchDate" 
            FROM predictions p
            JOIN markets m ON p."marketId" = m.id
            WHERE p.id = ${finalPredictionId} AND p."walletAddress" = ${walletAddress}
        `;
        if (predictionRes.rowCount === 0) {
            return NextResponse.json({ success: false, error: "Prediction not found or unauthorized" }, { status: 404 });
        }
        
        const prediction = predictionRes.rows[0];

        if (prediction.status !== 'PENDING') {
            return NextResponse.json({ success: false, error: "Only active (pending) predictions can be modified" }, { status: 400 });
        }

        // 3. Check Time Lockout (must be at least 5 mins before matchDate)
        const matchTime = new Date(prediction.matchDate).getTime();
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
            await sql`INSERT INTO treasury_logs ("walletAddress", amount, type) VALUES (${walletAddress}, 50, 'BURN_CHANGE_PREDICTION')`;
            await sql`INSERT INTO treasury_logs ("walletAddress", amount, type) VALUES (${walletAddress}, 50, 'REWARD_POOL_CHANGE_PREDICTION')`;

            // Update prediction
            await sql`UPDATE predictions SET prediction = ${newPrediction}, "updatedAt" = CURRENT_TIMESTAMP WHERE id = ${finalPredictionId}`;
            
            return NextResponse.json({ success: true, message: "Prediction updated successfully. 100 Tokens deducted." });

        } else if (action === 'CANCEL') {
            if (balance < 200) {
                return NextResponse.json({ success: false, error: "Insufficient Token Balance (200 required)" }, { status: 403 });
            }

            // Log 200 tokens (100 BURN, 100 REWARD_POOL)
            await sql`INSERT INTO treasury_logs ("walletAddress", amount, type) VALUES (${walletAddress}, 100, 'BURN_CANCEL_PREDICTION')`;
            await sql`INSERT INTO treasury_logs ("walletAddress", amount, type) VALUES (${walletAddress}, 100, 'REWARD_POOL_CANCEL_PREDICTION')`;

            // Update prediction status to CANCELED
            await sql`UPDATE predictions SET status = 'CANCELED' WHERE id = ${finalPredictionId}`;

            // Restore daily quota if prediction was placed today
            await sql`
                UPDATE users 
                SET "predictionsToday" = GREATEST("predictionsToday" - 1, 0) 
                WHERE "walletAddress" = ${walletAddress} 
                AND EXISTS (
                    SELECT 1 FROM predictions 
                    WHERE id = ${finalPredictionId} AND DATE(timestamp) = CURRENT_DATE
                )
            `;

            return NextResponse.json({ success: true, message: "Prediction canceled successfully. 200 Tokens deducted and daily quota restored." });
        } else {
            return NextResponse.json({ success: false, error: "Invalid action specified" }, { status: 400 });
        }
        
    } catch (error) {
        console.error("PUT /api/predictions/manage error:", error);
        return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 });
    }
}

