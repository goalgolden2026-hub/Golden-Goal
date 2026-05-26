import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Simulate SPL Token Balance Check (In Production, use Solana web3.js + getAccountInfo)
async function getTokenBalance(walletAddress) {
    // Demo implementation: We assume everyone has 30,000 tokens for testing.
    // In Phase 6, this will be replaced with real on-chain balance fetching.
    return 30000;
}

function getTierLimits(balance) {
    if (balance >= 50000) return { tier: 'Gold', limit: 10 };
    if (balance >= 25000) return { tier: 'Silver', limit: 5 };
    if (balance >= 10000) return { tier: 'Bronze', limit: 3 };
    return { tier: 'None', limit: 0 };
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { walletAddress, marketId, prediction, betType = 'MAIN' } = body;

        if (!walletAddress || !marketId || !prediction) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const sql = await getDb();
        
        // 1. Check Token Balance
        const balance = await getTokenBalance(walletAddress);
        const { tier, limit } = getTierLimits(balance);

        if (limit === 0) {
            return NextResponse.json({ success: false, error: "Insufficient Token Balance. You need at least 10,000 Golden Tokens to predict." }, { status: 403 });
        }

        // 2. Fetch User from DB (or create if not exists)
        let userRes = await sql`SELECT * FROM users WHERE "walletAddress" = ${walletAddress}`;
        
        if (userRes.rowCount === 0) {
            await sql`
                INSERT INTO users ("walletAddress", points, "betsToday", "lastBetDate") 
                VALUES (${walletAddress}, 0, 0, CURRENT_DATE)
            `;
            userRes = await sql`SELECT * FROM users WHERE "walletAddress" = ${walletAddress}`;
        }

        let user = userRes.rows[0];

        // 2.5 Check Active Stake for Quota Bonus
        const activeStakeRes = await sql`SELECT * FROM stakes WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE'`;
        let bonusBets = 0;
        let stakeTier = 0;
        
        if (activeStakeRes.rowCount > 0) {
            stakeTier = activeStakeRes.rows[0].tier;
            if (stakeTier === 1) bonusBets = 1;
            else if (stakeTier === 2) bonusBets = 3;
            else if (stakeTier === 3) bonusBets = 5;
            else if (stakeTier === 4) bonusBets = 10;
        }

        let finalLimit = limit + bonusBets;

        // 3. Reset daily limit if it's a new day
        const today = new Date().toISOString().split('T')[0];
        const lastBetDate = new Date(user.lastBetDate).toISOString().split('T')[0];

        if (today !== lastBetDate) {
            user.betsToday = 0;
            await sql`
                UPDATE users SET "betsToday" = 0, "lastBetDate" = CURRENT_DATE 
                WHERE "walletAddress" = ${walletAddress}
            `;
        }

        // 4. Check Daily Limit
        if (user.betsToday >= finalLimit) {
            return NextResponse.json({ success: false, error: `Daily limit reached (${finalLimit} bets). Come back tomorrow!` }, { status: 429 });
        }

        // 4.5 Check if user already has an active bet for this market and betType
        const existingBetRes = await sql`
            SELECT id FROM bets 
            WHERE "walletAddress" = ${walletAddress} 
            AND "marketId" = ${marketId} 
            AND "betType" = ${betType} 
            AND status = 'PENDING'
        `;

        if (existingBetRes.rowCount > 0) {
            return NextResponse.json({ 
                success: false, 
                error: "You already have an active prediction for this specific market. To modify your choice, go to the Portfolio page and use the Change feature." 
            }, { status: 400 });
        }

        // 5. Insert Bet
        await sql`
            INSERT INTO bets ("walletAddress", "marketId", prediction, "betType") 
            VALUES (${walletAddress}, ${marketId}, ${prediction}, ${betType})
        `;

        // 6. Increment betsToday
        await sql`
            UPDATE users SET "betsToday" = "betsToday" + 1 
            WHERE "walletAddress" = ${walletAddress}
        `;
        
        return NextResponse.json({ 
            success: true, 
            message: "Bet recorded successfully",
            remainingBets: finalLimit - (user.betsToday + 1),
            tier
        }, { status: 201 });

    } catch (error) {
        console.error("POST /api/bets error:", error);
        return NextResponse.json({ success: false, error: "Failed to record bet" }, { status: 500 });
    }
}
