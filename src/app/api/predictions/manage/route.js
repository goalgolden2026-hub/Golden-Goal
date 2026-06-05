import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenBalance } from '@/lib/solana';


export async function PUT(request) {
    try {
        const body = await request.json();
        const { walletAddress, betId, predictionId, action, newPrediction } = body;
        const finalPredictionId = predictionId || betId;

        if (!walletAddress || !finalPredictionId || !action) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const sql = await getDb();
        
        // 1. Check Token Balance (including active locks and treasury log adjustments to represent total holdings)
        const baseBalance = await getTokenBalance(walletAddress);
        let mockBalance = baseBalance;

        // Add active locks (since they are real on-chain transfers and have left the user's wallet)
        const activeLocksTotalRes = await sql`SELECT SUM(amount) as total FROM locks WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE'`;
        if (activeLocksTotalRes.rows[0].total) {
            mockBalance += parseInt(activeLocksTotalRes.rows[0].total);
        }

        // Apply treasury logs
        const logsRes = await sql`SELECT amount, type FROM treasury_logs WHERE "walletAddress" = ${walletAddress}`;
        for (const log of logsRes.rows) {
            const amt = parseFloat(log.amount);
            if (log.type.includes('BURN') || log.type.includes('REWARD_POOL') || log.type === 'TREASURY') {
                mockBalance -= amt; // Deductions logged as positive
            } else if (log.type === 'SPIN_PAYMENT') {
                mockBalance += amt; // Already negative
            } else if (log.type === 'REFERRAL_REWARD' || log.type === 'SPIN_REWARD_GOLDEN') {
                mockBalance += amt; // Additions
            }
        }

        // 2. Fetch Prediction and Market Data (including odds for recalculation)
        const predictionRes = await sql`
            SELECT p.*, m."matchDate", m.odds 
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
            if (mockBalance < 10000) {
                return NextResponse.json({ success: false, error: "Insufficient Token Balance (10,000 $GoldenGoal required)" }, { status: 403 });
            }
            if (!newPrediction) {
                return NextResponse.json({ success: false, error: "New prediction is required" }, { status: 400 });
            }
            
            // Log 10.000 tokens (5.000 BURN, 5.000 REWARD_POOL)
            await sql`INSERT INTO treasury_logs ("walletAddress", amount, type) VALUES (${walletAddress}, 5000, 'BURN_CHANGE_PREDICTION')`;
            await sql`INSERT INTO treasury_logs ("walletAddress", amount, type) VALUES (${walletAddress}, 5000, 'REWARD_POOL_CHANGE_PREDICTION')`;

            // Recalculate dynamic points reward for new prediction option
            let pointsReward = 100;
            try {
                const oddsObj = prediction.odds;
                const pType = prediction.predictionType;
                if (oddsObj && oddsObj[pType]) {
                    const oddsValue = oddsObj[pType][newPrediction];
                    if (oddsValue) {
                        let xp = 100;
                        switch (pType) {
                            case 'MAIN':
                                xp = Math.max(100, oddsValue * 100);
                                break;
                            case 'DOUBLE_CHANCE':
                                xp = Math.max(50, oddsValue * 80);
                                break;
                            case 'TOTAL_GOALS':
                                xp = Math.max(120, oddsValue * 100);
                                break;
                            case 'BTTS':
                                xp = Math.max(120, oddsValue * 100);
                                break;
                            case 'FIRST_HALF':
                                xp = Math.max(120, oddsValue * 100);
                                break;
                            case 'FIRST_GOAL':
                                xp = Math.min(600, Math.max(150, oddsValue * 100));
                                break;
                            default:
                                xp = oddsValue * 100;
                                break;
                        }
                        if (oddsValue > 4.00) {
                            xp = xp * 1.2;
                        }
                        pointsReward = Math.round(xp);
                    }
                }
            } catch (oddsErr) {
                console.error("Failed to recalculate points reward on change:", oddsErr);
            }

            // Update prediction and its pointsReward
            await sql`
                UPDATE predictions 
                SET prediction = ${newPrediction}, 
                    "pointsReward" = ${pointsReward}, 
                    "updatedAt" = CURRENT_TIMESTAMP 
                WHERE id = ${finalPredictionId}
            `;
            
            return NextResponse.json({ success: true, message: "Prediction updated successfully. 10,000 $GoldenGoal deducted." });

        } else if (action === 'CANCEL') {
            if (mockBalance < 20000) {
                return NextResponse.json({ success: false, error: "Insufficient Token Balance (20.000 $GoldenGoal required)" }, { status: 403 });
            }

            // Log 20.000 tokens (10.000 BURN, 10.000 REWARD_POOL)
            await sql`INSERT INTO treasury_logs ("walletAddress", amount, type) VALUES (${walletAddress}, 10000, 'BURN_CANCEL_PREDICTION')`;
            await sql`INSERT INTO treasury_logs ("walletAddress", amount, type) VALUES (${walletAddress}, 10000, 'REWARD_POOL_CANCEL_PREDICTION')`;

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

            return NextResponse.json({ success: true, message: "Prediction canceled successfully. 20.000 $GoldenGoal deducted and daily quota restored." });
        } else {
            return NextResponse.json({ success: false, error: "Invalid action specified" }, { status: 400 });
        }
        
    } catch (error) {
        console.error("PUT /api/predictions/manage error:", error);
        return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 });
    }
}

