import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get('wallet');

        if (!wallet) {
            return NextResponse.json({ success: false, error: "Wallet address is required" }, { status: 400 });
        }

        const sql = await getDb();
        
        // Fetch User Info
        let userPoints = 0;
        let predictionsToday = 0;
        const userRes = await sql`SELECT points, "predictionsToday" FROM users WHERE "walletAddress" = ${wallet}`;
        if (userRes.rowCount > 0) {
            userPoints = userRes.rows[0].points;
            predictionsToday = userRes.rows[0].predictionsToday;
        }

        // Fetch Predictions
        const { rows: predictions } = await sql`
            SELECT p.id as "predictionId", p.prediction, p."predictionType", p.status as "predictionStatus", p.timestamp, p."updatedAt", p."pointsReward",
                   m.id as "marketId", m."teamA", m."teamB", m."matchDate", m.status as "marketStatus"
            FROM predictions p
            JOIN markets m ON p."marketId" = m.id
            WHERE p."walletAddress" = ${wallet}
            ORDER BY p.timestamp DESC
        `;

        return NextResponse.json({ success: true, predictions, points: userPoints, predictionsToday }, { status: 200 });
    } catch (error) {
        console.error("GET /api/user/predictions error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch user data" }, { status: 500 });
    }
}

