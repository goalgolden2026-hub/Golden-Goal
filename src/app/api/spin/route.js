import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const REWARD_TIERS = [
    { index: 0, type: 'EMPTY', value: 0, label: 'Miss', prob: 20 },
    { index: 1, type: 'BET', value: 1, label: '1 Extra Bet', prob: 35 },
    { index: 2, type: 'BET', value: 3, label: '3 Extra Bets', prob: 15 },
    { index: 3, type: 'BET', value: 5, label: '5 Extra Bets', prob: 5 },
    { index: 4, type: 'GOLDEN', value: 1000, label: '1000 Golden', prob: 10 },
    { index: 5, type: 'USDC', value: 1, label: '1 USDC', prob: 10 },
    { index: 6, type: 'USDC', value: 10, label: '10 USDC', prob: 4 },
    { index: 7, type: 'GOLDEN', value: 5000, label: '5000 Golden', prob: 1 }
];

async function checkFreeSpinEligibility(sql, walletAddress) {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if user has already spun today for free
    const userRes = await sql`SELECT "lastFreeSpinDate" FROM users WHERE "walletAddress" = ${walletAddress}`;
    if (userRes.rowCount > 0) {
        const lastSpin = userRes.rows[0].lastFreeSpinDate;
        if (lastSpin && new Date(lastSpin).toISOString().split('T')[0] === today) {
            return false; // Already used today
        }
    }

    // Check if user has an active stake locked for >= 30 days
    // Since our stakes tier logic defines locking periods, we'll check if they have any active stake.
    // In our simplified logic: tier 3 or 4 are usually long term. Or just ANY active stake > 30 days.
    const activeStakeRes = await sql`
        SELECT * FROM stakes 
        WHERE "walletAddress" = ${walletAddress} 
        AND status = 'ACTIVE' 
        AND ("unlockDate" >= "createdAt" + INTERVAL '30 days')
    `;

    return activeStakeRes.rowCount > 0;
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

// Mock USDC Airdrop Smart Contract Call
async function sendUSDCAirdrop(walletAddress, amount) {
    console.log(`[SMART CONTRACT MOCK] Sent ${amount} USDC to ${walletAddress}`);
    return true;
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('walletAddress');
        if (!walletAddress) return NextResponse.json({ success: false, error: "Missing walletAddress" }, { status: 400 });

        const sql = await getDb();
        const isEligibleForFreeSpin = await checkFreeSpinEligibility(sql, walletAddress);

        let dynamicBalance = 30000;
        const activeStakesTotalRes = await sql`SELECT SUM(amount) as total FROM stakes WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE'`;
        if (activeStakesTotalRes.rows[0].total) dynamicBalance -= parseInt(activeStakesTotalRes.rows[0].total);

        const logsRes = await sql`SELECT amount, type FROM treasury_logs WHERE "walletAddress" = ${walletAddress}`;
        for (const log of logsRes.rows) {
            const amt = parseFloat(log.amount);
            if (log.type.includes('BURN') || log.type.includes('REWARD_POOL') || log.type === 'TREASURY') dynamicBalance -= amt;
            else if (log.type === 'SPIN_PAYMENT') dynamicBalance += amt;
            else if (log.type === 'REFERRAL_REWARD' || log.type === 'SPIN_REWARD_GOLDEN') dynamicBalance += amt;
        }

        return NextResponse.json({ 
            success: true, 
            isEligibleForFreeSpin,
            spinCost: 500,
            balance: dynamicBalance
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to fetch spin status" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { walletAddress } = body;
        if (!walletAddress) return NextResponse.json({ success: false, error: "Missing walletAddress" }, { status: 400 });

        const sql = await getDb();
        
        // 1. Determine Payment (Free vs 500 Tokens)
        const isFree = await checkFreeSpinEligibility(sql, walletAddress);
        
        if (isFree) {
            // Update lastFreeSpinDate to today
            await sql`
                UPDATE users SET "lastFreeSpinDate" = CURRENT_DATE 
                WHERE "walletAddress" = ${walletAddress}
            `;
        } else {
            // Check dynamic balance before deducting
            let dynamicBalance = 30000;
            const activeStakesTotalRes = await sql`SELECT SUM(amount) as total FROM stakes WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE'`;
            if (activeStakesTotalRes.rows[0].total) dynamicBalance -= parseInt(activeStakesTotalRes.rows[0].total);

            const logsRes = await sql`SELECT amount, type FROM treasury_logs WHERE "walletAddress" = ${walletAddress}`;
            for (const log of logsRes.rows) {
                const amt = parseFloat(log.amount);
                if (log.type.includes('BURN') || log.type.includes('REWARD_POOL') || log.type === 'TREASURY') dynamicBalance -= amt;
                else if (log.type === 'SPIN_PAYMENT') dynamicBalance += amt;
                else if (log.type === 'REFERRAL_REWARD' || log.type === 'SPIN_REWARD_GOLDEN') dynamicBalance += amt;
            }

            if (dynamicBalance < 500) {
                return NextResponse.json({ success: false, error: "Insufficient Golden Token balance. 500 tokens are required to spin." }, { status: 400 });
            }

            // Deduct 500 Golden Tokens
            await sql`
                INSERT INTO treasury_logs ("walletAddress", amount, type) 
                VALUES (${walletAddress}, -500, 'SPIN_PAYMENT')
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
        } else if (reward.type === 'GOLDEN') {
            await sql`
                INSERT INTO treasury_logs ("walletAddress", amount, type) 
                VALUES (${walletAddress}, ${reward.value}, 'SPIN_REWARD_GOLDEN')
            `;
        } else if (reward.type === 'USDC') {
            await sql`
                INSERT INTO treasury_logs ("walletAddress", amount, type) 
                VALUES (${walletAddress}, ${reward.value}, 'SPIN_REWARD_USDC')
            `;
            await sendUSDCAirdrop(walletAddress, reward.value);
        }

        return NextResponse.json({ 
            success: true, 
            reward: {
                index: reward.index,
                label: reward.label,
                type: reward.type,
                value: reward.value
            },
            wasFree: isFree
        }, { status: 200 });

    } catch (error) {
        console.error("POST /api/spin error:", error);
        return NextResponse.json({ success: false, error: "Failed to execute spin" }, { status: 500 });
    }
}
