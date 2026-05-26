import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const { marketId, betType, predictionType, winningPrediction } = body;
        const finalPredictionType = predictionType || betType;

        if (!marketId || !finalPredictionType || !winningPrediction) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const sql = await getDb();

        // 1. Get Market Info
        const marketRes = await sql`SELECT * FROM markets WHERE id = ${marketId}`;
        if (marketRes.rowCount === 0) {
            return NextResponse.json({ success: false, error: "Market not found" }, { status: 404 });
        }
        const market = marketRes.rows[0];

        // 2. Fetch all PENDING predictions for this market and predictionType
        const betsRes = await sql`
            SELECT id, "walletAddress", prediction FROM predictions 
            WHERE "marketId" = ${marketId} AND "predictionType" = ${finalPredictionType} AND status = 'PENDING'
        `;
        
        const bets = betsRes.rows;
        if (bets.length === 0) {
             return NextResponse.json({ success: true, message: `No pending predictions found for ${finalPredictionType}.`, winnersCount: 0 });
        }

        const pointsReward = market.pointsReward || 100;
        let winnersCount = 0;

        // 3. Process each prediction
        for (const bet of bets) {
            if (bet.prediction === winningPrediction) {
                // Win
                await sql`UPDATE predictions SET status = 'WON' WHERE id = ${bet.id}`;
                
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
                await sql`UPDATE predictions SET status = 'LOST' WHERE id = ${bet.id}`;
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `${finalPredictionType} resolved! Awarded ${pointsReward} points to ${winnersCount} winners out of ${bets.length} total predictions.`,
            winnersCount: winnersCount
        });

    } catch (error) {
        console.error("POST /api/admin/resolve error:", error);
        return NextResponse.json({ success: false, error: "Failed to resolve market" }, { status: 500 });
    }
}
