import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

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

    let boxCost = 100;
    let requiresMinBalance = false;
    let isEligibleForFreeBox = false;

    if (activeTier === 0) {
        boxCost = 100;
    } else if (activeTier === 1) {
        boxCost = 75;
    } else if (activeTier === 2) {
        boxCost = 50;
    } else if (activeTier === 3) {
        boxCost = 25;
    } else if (activeTier === 4) {
        // Check free box eligibility
        const today = new Date().toISOString().split('T')[0];
        const userRes = await sql`SELECT "lastFreeBoxDate" FROM users WHERE "walletAddress" = ${walletAddress}`;
        if (userRes.rowCount > 0) {
            const lastFreeBox = userRes.rows[0].lastFreeBoxDate;
            if (!lastFreeBox || new Date(lastFreeBox).toISOString().split('T')[0] !== today) {
                isEligibleForFreeBox = true;
                boxCost = 0;
            } else {
                boxCost = 25;
            }
        } else {
            isEligibleForFreeBox = true;
            boxCost = 0;
        }
    }

    return { isEligibleForFreeBox, boxCost, requiresMinBalance, activeTier };
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

        // Fetch user's current points
        let points = 0;
        const userRes = await sql`SELECT points FROM users WHERE "walletAddress" = ${walletAddress}`;
        if (userRes.rowCount > 0 && userRes.rows[0].points !== null) {
            points = parseInt(userRes.rows[0].points);
        }

        return NextResponse.json({ 
            success: true, 
            isEligibleForFreeBox: status.isEligibleForFreeBox,
            boxCost: status.boxCost,
            requiresMinBalance: status.requiresMinBalance,
            activeTier: status.activeTier,
            points: points
        }, { status: 200 });

    } catch (error) {
        console.error("GET /api/reward-box error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch reward box status" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { walletAddress } = body;
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
            // Update lastFreeBoxDate to today
            await sql`
                UPDATE users SET "lastFreeBoxDate" = CURRENT_DATE 
                WHERE "walletAddress" = ${walletAddress}
            `;
        } else {
            // Fetch user's current points (reload to get up-to-date points after daily reset)
            let points = 0;
            const pointsRes = await sql`SELECT points FROM users WHERE "walletAddress" = ${walletAddress}`;
            if (pointsRes.rowCount > 0 && pointsRes.rows[0].points !== null) {
                points = parseInt(pointsRes.rows[0].points);
            }

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

