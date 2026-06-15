import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';
import { isAdminWallet } from '@/lib/whitelist';

const REWARD_TIERS = [
    { index: 0, type: 'EMPTY', value: 0, label: 'Miss', prob: 20 },
    { index: 1, type: 'PREDICTION', value: 1, label: '+1 Prediction Quota', prob: 35 },
    { index: 2, type: 'PREDICTION', value: 3, label: '+3 Prediction Quotas', prob: 15 },
    { index: 3, type: 'PREDICTION', value: 5, label: '+5 Prediction Quotas', prob: 5 },
    { index: 4, type: 'XP', value: 100, label: '+100 XP Points', prob: 10 },
    { index: 5, type: 'XP', value: 250, label: '+250 XP Points', prob: 10 },
    { index: 6, type: 'XP', value: 500, label: '+500 XP Points', prob: 4 },
    { index: 7, type: 'XP', value: 1000, label: '+1000 XP Points', prob: 1 }
];

async function getBoxStatus(sql, walletAddress) {
    let activeTier = 0;
    // Get the highest active lock tier
    const activeLockRes = await sql`SELECT tier FROM locks WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE' ORDER BY tier DESC LIMIT 1`;
    if (activeLockRes.rowCount > 0) activeTier = activeLockRes.rows[0].tier;

    // Get event participants (first 100 unique wallets with active locks of Tier 2, 3, 4 ordered by createdAt ASC)
    const participantsRes = await sql`
        SELECT "walletAddress"
        FROM locks
        WHERE status = 'ACTIVE' AND tier IN (2, 3, 4)
        GROUP BY "walletAddress"
        ORDER BY MIN("createdAt") ASC
        LIMIT 100
    `;
    const participantWallets = participantsRes.rows.map(r => r.walletAddress);
    const isEventParticipant = participantWallets.includes(walletAddress);
    const userPosition = participantWallets.indexOf(walletAddress);

    let boxCost = 250;
    let requiresMinBalance = false;
    let isEligibleForFreeBox = false;
    let freeBoxesOpenedToday = 0;

    const today = new Date().toISOString().split('T')[0];
    const userRes = await sql`SELECT "lastFreeBoxDate", "freeBoxesOpenedToday" FROM users WHERE "walletAddress" = ${walletAddress}`;
    
    if (userRes.rowCount > 0) {
        const lastFreeBox = userRes.rows[0].lastFreeBoxDate;
        const lastFreeBoxStr = lastFreeBox ? new Date(lastFreeBox).toISOString().split('T')[0] : null;
        if (lastFreeBoxStr === today) {
            freeBoxesOpenedToday = userRes.rows[0].freeBoxesOpenedToday || 0;
        }
    }

    const isAdmin = isAdminWallet(walletAddress);

    if (isAdmin) {
        // Admin gets 3 free boxes daily
        if (freeBoxesOpenedToday < 3) {
            isEligibleForFreeBox = true;
            boxCost = 0;
        } else {
            boxCost = 150;
        }
    } else if (isEventParticipant) {
        // Event rules apply: 3 free boxes daily
        if (freeBoxesOpenedToday < 3) {
            isEligibleForFreeBox = true;
            boxCost = 0;
        } else {
            // Normal rate after 3 free boxes
            if (activeTier === 4) boxCost = 150;
            else if (activeTier === 3) boxCost = 150;
            else if (activeTier === 2) boxCost = 200;
        }
    } else {
        // Standard rules apply
        if (activeTier === 4) {
            // Tier 4 gets 1 free box per day
            if (freeBoxesOpenedToday < 1) {
                isEligibleForFreeBox = true;
                boxCost = 0;
            } else {
                boxCost = 150;
            }
        } else if (activeTier === 3) {
            boxCost = 150;
        } else if (activeTier === 2) {
            boxCost = 200;
        } else if (activeTier === 1) {
            boxCost = 225;
        } else {
            boxCost = 250;
        }
    }

    return { 
        isEligibleForFreeBox, 
        boxCost, 
        requiresMinBalance, 
        activeTier, 
        freeBoxesOpenedToday, 
        isEventParticipant, 
        userPosition, 
        totalParticipants: participantWallets.length 
    };
}

function openRNG() {
    const rand = Math.random() * 100; // 0 to 100
    let cumulative = 0;
    for (const reward of REWARD_TIERS) {
        cumulative += reward.prob;
        if (rand < cumulative) {
            return reward;
        }
    }
    return REWARD_TIERS[0]; // fallback
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('walletAddress');
        if (!walletAddress) return NextResponse.json({ success: false, error: "Missing walletAddress" }, { status: 400 });

        const sql = await getDb();
        const status = await getBoxStatus(sql, walletAddress);

        // Fetch user's current points and socialPoints
        let points = 0;
        let socialPoints = 0;
        let twitterHandle = null;
        const userRes = await sql`SELECT points, "socialPoints", "twitterHandle" FROM users WHERE "walletAddress" = ${walletAddress}`;
        if (userRes.rowCount > 0) {
            points = parseInt(userRes.rows[0].points || 0);
            socialPoints = parseInt(userRes.rows[0].socialPoints || 0);
            twitterHandle = userRes.rows[0].twitterHandle || null;
        }

        return NextResponse.json({ 
            success: true, 
            isEligibleForFreeBox: status.isEligibleForFreeBox,
            boxCost: status.boxCost,
            socialBoxCost: status.isEligibleForFreeBox ? 0 : 100, // Flat price of 100 SP for social method
            requiresMinBalance: status.requiresMinBalance,
            activeTier: status.activeTier,
            points: points,
            socialPoints: socialPoints,
            twitterHandle: twitterHandle,
            freeBoxesOpenedToday: status.freeBoxesOpenedToday,
            isEventParticipant: status.isEventParticipant,
            userPosition: status.userPosition,
            totalParticipants: status.totalParticipants
        }, { status: 200 });

    } catch (error) {
        console.error("GET /api/reward-box error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch reward box status" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { walletAddress, paymentMethod } = body;
        if (!walletAddress) return NextResponse.json({ success: false, error: "Missing walletAddress" }, { status: 400 });

        const sql = await getDb();
        
        // Ensure user exists
        let userRes = await sql`SELECT * FROM users WHERE "walletAddress" = ${walletAddress}`;
        if (userRes.rowCount === 0) {
            const newCode = crypto.randomBytes(3).toString('hex').toUpperCase();
            await sql`
                INSERT INTO users ("walletAddress", points, "predictionsToday", "lastPredictionDate", "referralCode", "referralPoints") 
                VALUES (${walletAddress}, 0, 0, CURRENT_DATE, ${newCode}, 0)
            `;
            userRes = await sql`SELECT * FROM users WHERE "walletAddress" = ${walletAddress}`;
        }
        
        const user = userRes.rows[0];

        // Daily Reset Check for Quota & Bonus (if new day)
        const today = new Date().toISOString().split('T')[0];
        const lastPredictionDate = user.lastPredictionDate 
            ? new Date(user.lastPredictionDate).toISOString().split('T')[0] 
            : null;
            
        if (!lastPredictionDate || lastPredictionDate !== today) {
            await sql`
                UPDATE users 
                SET "predictionsToday" = 0, "bonusPredictions" = 0, "lastPredictionDate" = CURRENT_DATE 
                WHERE "walletAddress" = ${walletAddress}
            `;
        }

        // 1. Determine Payment (Free vs Dynamic XP Points Cost)
        const status = await getBoxStatus(sql, walletAddress);
        
        if (status.isEligibleForFreeBox) {
            // Update lastFreeBoxDate and increment freeBoxesOpenedToday
            const lastFreeBoxStr = user.lastFreeBoxDate ? new Date(user.lastFreeBoxDate).toISOString().split('T')[0] : null;
            if (lastFreeBoxStr === today) {
                await sql`
                    UPDATE users 
                    SET "freeBoxesOpenedToday" = COALESCE("freeBoxesOpenedToday", 0) + 1, "lastFreeBoxDate" = CURRENT_DATE 
                    WHERE "walletAddress" = ${walletAddress}
                `;
            } else {
                await sql`
                    UPDATE users 
                    SET "freeBoxesOpenedToday" = 1, "lastFreeBoxDate" = CURRENT_DATE 
                    WHERE "walletAddress" = ${walletAddress}
                `;
            }
        } else {
            // Fetch user's current points and socialPoints (reload to get up-to-date values after daily reset)
            let points = 0;
            let socialPoints = 0;
            let twitterHandle = null;
            const pointsRes = await sql`SELECT points, "socialPoints", "twitterHandle" FROM users WHERE "walletAddress" = ${walletAddress}`;
            if (pointsRes.rowCount > 0) {
                points = parseInt(pointsRes.rows[0].points || 0);
                socialPoints = parseInt(pointsRes.rows[0].socialPoints || 0);
                twitterHandle = pointsRes.rows[0].twitterHandle || null;
            }

            if (paymentMethod === 'SP') {
                if (!twitterHandle) {
                    return NextResponse.json({ success: false, error: "Please link your Twitter (X) account first to open the Rewards Box using Social Points." }, { status: 400 });
                }

                const spCost = 100; // Flat price of 100 SP
                if (socialPoints < spCost) {
                    return NextResponse.json({ success: false, error: `Insufficient Social Points. ${spCost} SP points are required to open the Rewards Box.` }, { status: 400 });
                }

                // Deduct Box Cost from user's socialPoints directly and update lastFreeBoxDate!
                await sql`
                    UPDATE users 
                    SET "socialPoints" = COALESCE("socialPoints", 0) - ${spCost}, "lastFreeBoxDate" = CURRENT_DATE
                    WHERE "walletAddress" = ${walletAddress}
                `;
                
                // Log the payment in treasury_logs
                await sql`
                    INSERT INTO treasury_logs ("walletAddress", amount, type) 
                    VALUES (${walletAddress}, ${-spCost}, 'REWARDS_BOX_OPEN_SP')
                `;
            } else {
                if (points < status.boxCost) {
                    return NextResponse.json({ success: false, error: `Insufficient XP Points. ${status.boxCost} XP points are required to open the Rewards Box.` }, { status: 400 });
                }

                // Deduct Box Cost from user's points directly and update lastFreeBoxDate!
                await sql`
                    UPDATE users 
                    SET points = COALESCE(points, 0) - ${status.boxCost}, "lastFreeBoxDate" = CURRENT_DATE
                    WHERE "walletAddress" = ${walletAddress}
                `;
                
                // Log the payment in treasury_logs
                await sql`
                    INSERT INTO treasury_logs ("walletAddress", amount, type) 
                    VALUES (${walletAddress}, ${-status.boxCost}, 'REWARDS_BOX_OPEN_XP')
                `;
            }
        }

        // 2. Box RNG
        const reward = openRNG();

        // 3. Apply Reward
        if (reward.type === 'PREDICTION') {
            await sql`
                UPDATE users 
                SET "bonusPredictions" = COALESCE("bonusPredictions", 0) + ${reward.value} 
                WHERE "walletAddress" = ${walletAddress}
            `;
        } else if (reward.type === 'XP') {
            await sql`
                UPDATE users 
                SET points = COALESCE(points, 0) + ${reward.value} 
                WHERE "walletAddress" = ${walletAddress}
            `;
            await sql`
                INSERT INTO treasury_logs ("walletAddress", amount, type) 
                VALUES (${walletAddress}, ${reward.value}, 'REWARDS_BOX_WIN_XP')
            `;
        }

        return NextResponse.json({ 
            success: true, 
            reward: {
                index: reward.index,
                label: reward.label,
                type: reward.type,
                value: reward.value
            },
            wasFree: status.isEligibleForFreeBox
        }, { status: 200 });

    } catch (error) {
        console.error("POST /api/reward-box error:", error);
        return NextResponse.json({ success: false, error: "Failed to open Reward Box" }, { status: 500 });
    }
}

