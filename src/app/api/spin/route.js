import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const REWARD_TIERS = [
    { index: 0, type: 'EMPTY', value: 0, label: 'Miss', prob: 20 },
    { index: 1, type: 'BET', value: 1, label: '+1 Prediction Quota', prob: 35 },
    { index: 2, type: 'BET', value: 3, label: '+3 Prediction Quotas', prob: 15 },
    { index: 3, type: 'BET', value: 5, label: '+5 Prediction Quotas', prob: 5 },
    { index: 4, type: 'XP', value: 100, label: '+100 XP Points', prob: 10 },
    { index: 5, type: 'XP', value: 250, label: '+250 XP Points', prob: 10 },
    { index: 6, type: 'XP', value: 500, label: '+500 XP Points', prob: 4 },
    { index: 7, type: 'XP', value: 1000, label: '+1000 XP Points', prob: 1 }
];
async function getSpinStatus(sql, walletAddress) {
    let activeTier = 0;
    // Get the highest active stake tier
    const activeStakeRes = await sql`SELECT tier FROM stakes WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE' ORDER BY tier DESC LIMIT 1`;
    if (activeStakeRes.rowCount > 0) activeTier = activeStakeRes.rows[0].tier;

    let spinCost = 100;
    let requiresMinBalance = false;
    let isEligibleForFreeSpin = false;

    if (activeTier === 0) {
        spinCost = 100;
    } else if (activeTier === 1) {
        spinCost = 75;
    } else if (activeTier === 2) {
        spinCost = 50;
    } else if (activeTier === 3) {
        spinCost = 25;
    } else if (activeTier === 4) {
        // Check free spin eligibility
        const today = new Date().toISOString().split('T')[0];
        const userRes = await sql`SELECT "lastFreeSpinDate" FROM users WHERE "walletAddress" = ${walletAddress}`;
        if (userRes.rowCount > 0) {
            const lastSpin = userRes.rows[0].lastFreeSpinDate;
            if (!lastSpin || new Date(lastSpin).toISOString().split('T')[0] !== today) {
                isEligibleForFreeSpin = true;
                spinCost = 0;
            } else {
                spinCost = 25;
            }
        } else {
            isEligibleForFreeSpin = true;
            spinCost = 0;
        }
    }

    return { isEligibleForFreeSpin, spinCost, requiresMinBalance, activeTier };
}

function spinRNG() {
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
        const status = await getSpinStatus(sql, walletAddress);

        // Fetch user's current points
        let points = 0;
        const userRes = await sql`SELECT points FROM users WHERE "walletAddress" = ${walletAddress}`;
        if (userRes.rowCount > 0 && userRes.rows[0].points !== null) {
            points = parseInt(userRes.rows[0].points);
        }

        return NextResponse.json({ 
            success: true, 
            isEligibleForFreeSpin: status.isEligibleForFreeSpin,
            spinCost: status.spinCost,
            requiresMinBalance: status.requiresMinBalance,
            activeTier: status.activeTier,
            points: points
        }, { status: 200 });

    } catch (error) {
        console.error("GET /api/spin error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch spin status" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { walletAddress } = body;
        if (!walletAddress) return NextResponse.json({ success: false, error: "Missing walletAddress" }, { status: 400 });

        const sql = await getDb();
        
        // 1. Determine Payment (Free vs Dynamic XP Points Cost)
        const status = await getSpinStatus(sql, walletAddress);
        
        if (status.isEligibleForFreeSpin) {
            // Update lastFreeSpinDate to today
            await sql`
                UPDATE users SET "lastFreeSpinDate" = CURRENT_DATE 
                WHERE "walletAddress" = ${walletAddress}
            `;
        } else {
            // Fetch user's current points
            let points = 0;
            const userRes = await sql`SELECT points FROM users WHERE "walletAddress" = ${walletAddress}`;
            if (userRes.rowCount > 0 && userRes.rows[0].points !== null) {
                points = parseInt(userRes.rows[0].points);
            }

            if (points < status.spinCost) {
                return NextResponse.json({ success: false, error: `Insufficient XP Points. ${status.spinCost} XP points are required to open the Rewards Box.` }, { status: 400 });
            }

            // Deduct Spin Cost from user's points directly!
            await sql`
                UPDATE users 
                SET points = COALESCE(points, 0) - ${status.spinCost} 
                WHERE "walletAddress" = ${walletAddress}
            `;
            
            // Log the payment in treasury_logs
            await sql`
                INSERT INTO treasury_logs ("walletAddress", amount, type) 
                VALUES (${walletAddress}, ${-status.spinCost}, 'REWARDS_BOX_OPEN_XP')
            `;
        }

        // 2. Spin RNG
        const reward = spinRNG();

        // 3. Apply Reward
        if (reward.type === 'BET') {
            await sql`
                UPDATE users 
                SET "spinBonusBets" = COALESCE("spinBonusBets", 0) + ${reward.value} 
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
            wasFree: status.isEligibleForFreeSpin
        }, { status: 200 });

    } catch (error) {
        console.error("POST /api/spin error:", error);
        return NextResponse.json({ success: false, error: "Failed to execute spin" }, { status: 500 });
    }
}
