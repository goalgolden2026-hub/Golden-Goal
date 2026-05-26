import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const { marketId, betType, winningPrediction } = body;

        if (!marketId || !betType || !winningPrediction) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const sql = await getDb();

        // 1. Get Market Info
        const marketRes = await sql`SELECT * FROM markets WHERE id = ${marketId}`;
        if (marketRes.rowCount === 0) {
            return NextResponse.json({ success: false, error: "Market not found" }, { status: 404 });
        }
        const market = marketRes.rows[0];

        // 2. Fetch all PENDING bets for this market and betType
        const betsRes = await sql`
            SELECT id, "walletAddress", prediction FROM bets 
            WHERE "marketId" = ${marketId} AND "betType" = ${betType} AND status = 'PENDING'
        `;
        
        const bets = betsRes.rows;
        if (bets.length === 0) {
             return NextResponse.json({ success: true, message: `No pending bets found for ${betType}.`, winnersCount: 0 });
        }

        const pointsReward = market.pointsReward || 100;
        let winnersCount = 0;

        // 3. Process each bet
        for (const bet of bets) {
            if (bet.prediction === winningPrediction) {
                // Win
                await sql`UPDATE bets SET status = 'WON' WHERE id = ${bet.id}`;
                
                // Calculate Multiplier based on Active Stake
                const activeStakeRes = await sql`SELECT * FROM stakes WHERE "walletAddress" = ${bet.walletAddress} AND status = 'ACTIVE'`;
                let finalReward = pointsReward;
                
                if (activeStakeRes.rowCount > 0) {
                    const tier = activeStakeRes.rows[0].tier;
                    if (tier === 3) finalReward = Math.floor(pointsReward * 1.10);
                    else if (tier === 4) finalReward = Math.floor(pointsReward * 1.25);
                }

                await sql`UPDATE users SET points = points + ${finalReward} WHERE "walletAddress" = ${bet.walletAddress}`;
                winnersCount++;
            } else {
                // Loss
                await sql`UPDATE bets SET status = 'LOST' WHERE id = ${bet.id}`;
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `${betType} resolved! Awarded ${pointsReward} points to ${winnersCount} winners out of ${bets.length} total bets.`,
            winnersCount: winnersCount
        });

    } catch (error) {
        console.error("POST /api/admin/resolve error:", error);
        return NextResponse.json({ success: false, error: "Failed to resolve market" }, { status: 500 });
    }
}
