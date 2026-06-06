import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isAdminWallet } from '@/lib/whitelist';
import { getTokenBalance } from '@/lib/solana';


function getTierLimits(balance) {
    if (balance >= 250000) return { tier: 'Standard', limit: 3 };
    return { tier: 'None', limit: 0 };
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { walletAddress, marketId, prediction, predictionType, betType, referredBy } = body;
        const finalPredictionType = predictionType || betType || 'MAIN';

        if (!walletAddress || !marketId || !prediction) {
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

        const { tier, limit } = getTierLimits(mockBalance);

        if (limit === 0) {
            return NextResponse.json({ success: false, error: "Insufficient Token Balance. You need to hold at least 250.000 $GoldenGoal tokens in your wallet to make predictions." }, { status: 403 });
        }

        // 2. Fetch User from DB (or create if not exists)
        let userRes = await sql`SELECT * FROM users WHERE "walletAddress" = ${walletAddress}`;
        let isFirstPrediction = false;
        
        if (userRes.rowCount === 0) {
            isFirstPrediction = true;
            await sql`
                INSERT INTO users ("walletAddress", points, "predictionsToday", "lastPredictionDate", "referredBy") 
                VALUES (${walletAddress}, 0, 0, CURRENT_DATE, ${referredBy || null})
            `;
            userRes = await sql`SELECT * FROM users WHERE "walletAddress" = ${walletAddress}`;
        }

        let user = userRes.rows[0];

        // 2.5 Check Active Lock for Quota Bonus
        const activeLockRes = await sql`SELECT * FROM locks WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE'`;
        let bonusPredictions = 0;
        let lockTier = 0;
        
        if (activeLockRes.rowCount > 0) {
            lockTier = activeLockRes.rows[0].tier;
            if (lockTier === 1) bonusPredictions = 1;
            else if (lockTier === 2) bonusPredictions = 3;
            else if (lockTier === 3) bonusPredictions = 5;
            else if (lockTier === 4) bonusPredictions = 10;
        }

        let finalLimit = limit + bonusPredictions + (user.bonusPredictions || 0);

        // 3. Reset daily limit if it's a new day
        const today = new Date().toISOString().split('T')[0];
        const lastPredictionDate = new Date(user.lastPredictionDate).toISOString().split('T')[0];

        if (today !== lastPredictionDate) {
            user.predictionsToday = 0;
            user.bonusPredictions = 0;
            await sql`
                UPDATE users 
                SET "predictionsToday" = 0, "bonusPredictions" = 0, "lastPredictionDate" = CURRENT_DATE 
                WHERE "walletAddress" = ${walletAddress}
            `;
            // Recalculate finalLimit since bonusPredictions is reset
            finalLimit = limit + bonusPredictions;
        }

        // 4. Check Daily Limit
        if (isAdminWallet(walletAddress)) {
            finalLimit = Math.max(finalLimit, 20);
        }

        if (user.predictionsToday >= finalLimit) {
            return NextResponse.json({ success: false, error: `Daily limit reached (${finalLimit} predictions). Come back tomorrow!` }, { status: 429 });
        }

        // 4.5 Check if user already has an active prediction for this market and predictionType
        const existingPredictionRes = await sql`
            SELECT id FROM predictions 
            WHERE "walletAddress" = ${walletAddress} 
            AND "marketId" = ${marketId} 
            AND "predictionType" = ${finalPredictionType} 
            AND status = 'PENDING'
        `;

        if (existingPredictionRes.rowCount > 0) {
            return NextResponse.json({ 
                success: false, 
                error: "You already have an active prediction for this specific market. To modify your choice, go to the Dashboard page and use the Change feature." 
                // Note: Portfolio page was renamed to Dashboard page in previous steps
            }, { status: 400 });
        }

        // 4.6 Fetch market details and calculate dynamic points reward
        const marketRes = await sql`SELECT * FROM markets WHERE id = ${marketId}`;
        if (marketRes.rowCount === 0) {
            return NextResponse.json({ success: false, error: "Market not found" }, { status: 404 });
        }
        const market = marketRes.rows[0];

        let pointsReward = 100;
        try {
            const oddsObj = market.odds;
            if (oddsObj && oddsObj[finalPredictionType]) {
                const oddsValue = oddsObj[finalPredictionType][prediction];
                if (oddsValue) {
                    let xp = 100;
                    switch (finalPredictionType) {
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
            console.error("Failed to calculate dynamic XP reward:", oddsErr);
        }

        // 5. Insert Prediction
        await sql`
            INSERT INTO predictions ("walletAddress", "marketId", prediction, "predictionType", "pointsReward") 
            VALUES (${walletAddress}, ${marketId}, ${prediction}, ${finalPredictionType}, ${pointsReward})
        `;

        // 6. Increment predictionsToday
        await sql`
            UPDATE users SET "predictionsToday" = "predictionsToday" + 1 
            WHERE "walletAddress" = ${walletAddress}
        `;
        
        // 7. Referral System Logic (Only on First Prediction)
        if (isFirstPrediction && referredBy) {
            try {
                const referrerRes = await sql`SELECT * FROM users WHERE "referralCode" = ${referredBy}`;
                if (referrerRes.rowCount > 0 && referrerRes.rows[0].walletAddress !== walletAddress) {
                    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
                    
                    const ipCheckRes = await sql`SELECT id FROM referrals WHERE "ipAddress" = ${ipAddress} AND "ipAddress" != 'unknown'`;
                    
                    if (ipCheckRes.rowCount > 0) {
                        await sql`
                            INSERT INTO referrals ("referrerCode", "referredWallet", "ipAddress", status)
                            VALUES (${referredBy}, ${walletAddress}, ${ipAddress}, 'IP_BLOCKED')
                        `;
                    } else {
                        await sql`
                            INSERT INTO referrals ("referrerCode", "referredWallet", "ipAddress", status)
                            VALUES (${referredBy}, ${walletAddress}, ${ipAddress}, 'COMPLETED')
                        `;
                        await sql`
                            UPDATE users 
                            SET "referralPoints" = COALESCE("referralPoints", 0) + 100 
                            WHERE "referralCode" = ${referredBy}
                        `;
                    }
                }
            } catch (refErr) {
                console.error("Referral Error:", refErr);
            }
        }
        
        return NextResponse.json({ 
            success: true, 
            message: "Prediction recorded successfully",
            remainingBets: finalLimit - (user.predictionsToday + 1),
            tier
        }, { status: 201 });

    } catch (error) {
        console.error("POST /api/predictions error:", error);
        return NextResponse.json({ success: false, error: "Failed to record prediction" }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const sql = await getDb();
        const { rows } = await sql`
            SELECT 
                p.id, 
                p."walletAddress", 
                p.prediction, 
                p."predictionType", 
                p.timestamp,
                m."teamA", 
                m."teamB"
            FROM predictions p
            JOIN markets m ON p."marketId" = m.id
            ORDER BY p.timestamp DESC
            LIMIT 10
        `;
        return NextResponse.json({ success: true, predictions: rows });
    } catch (error) {
        console.error("GET /api/predictions error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch latest predictions" }, { status: 500 });
    }
}

