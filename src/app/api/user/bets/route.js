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
        let betsToday = 0;
        const userRes = await sql`SELECT points, "betsToday" FROM users WHERE "walletAddress" = ${wallet}`;
        if (userRes.rowCount > 0) {
            userPoints = userRes.rows[0].points;
            betsToday = userRes.rows[0].betsToday;
        }

        // Fetch Bets
        const { rows: bets } = await sql`
            SELECT b.id as "betId", b.prediction, b."betType", b.status as "betStatus", b.timestamp, b."updatedAt",
                   m.id as "marketId", m."teamA", m."teamB", m."matchDate", m.status as "marketStatus", m."pointsReward"
            FROM bets b
            JOIN markets m ON b."marketId" = m.id
            WHERE b."walletAddress" = ${wallet}
            ORDER BY b.timestamp DESC
        `;

        return NextResponse.json({ success: true, bets, points: userPoints, betsToday }, { status: 200 });
    } catch (error) {
        console.error("GET /api/user/bets error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch user data" }, { status: 500 });
    }
}
