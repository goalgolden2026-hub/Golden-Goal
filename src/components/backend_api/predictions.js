import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
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
        
        // 1. Check Token Balance
        const balance = await getTokenBalance(walletAddress);
        const { tier, limit } = getTierLimits(balance);

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

        // 5. Insert Prediction
        await sql`
            INSERT INTO predictions ("walletAddress", "marketId", prediction, "predictionType") 
            VALUES (${walletAddress}, ${marketId}, ${prediction}, ${finalPredictionType})
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

