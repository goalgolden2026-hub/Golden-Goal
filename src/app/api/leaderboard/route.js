import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const sql = await getDb();
        
        // Fetch top users by points
        const { rows: leaderboard } = await sql`
            SELECT 
                u."walletAddress", 
                u.points, 
                u."betsToday",
                (SELECT COUNT(*) FROM bets b WHERE b."walletAddress" = u."walletAddress") as "totalBets",
                (SELECT COUNT(*) FROM bets b WHERE b."walletAddress" = u."walletAddress" AND b.status = 'WON') as "wonBets",
                (
                    SELECT COALESCE(SUM(m."pointsReward"), 0) 
                    FROM bets b 
                    JOIN markets m ON b."marketId" = m.id 
                    WHERE b."walletAddress" = u."walletAddress" 
                    AND b.status = 'WON' 
                    AND b."updatedAt" >= NOW() - INTERVAL '7 days'
                ) as "weeklyPoints"
            FROM users u
            ORDER BY u.points DESC
            LIMIT 50
        `;

        const leaderboardWithStats = leaderboard.map(user => {
            const totalBets = parseInt(user.totalBets) || 0;
            const wonBets = parseInt(user.wonBets) || 0;
            const winrate = totalBets > 0 ? Math.round((wonBets / totalBets) * 100) : 0;
            return {
                ...user,
                totalBets,
                wonBets,
                winrate,
                weeklyPoints: parseInt(user.weeklyPoints) || 0
            };
        });

        return NextResponse.json({ success: true, leaderboard: leaderboardWithStats }, { status: 200 });
    } catch (error) {
        console.error("GET /api/leaderboard error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}
