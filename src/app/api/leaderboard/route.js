import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('walletAddress');

        const sql = await getDb();
        
        // Fetch top users by points
        const { rows: leaderboard } = await sql`
            SELECT 
                u."walletAddress", 
                u.points, 
                u."predictionsToday",
                (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress") as "totalPredictions",
                (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress" AND p.status = 'WON') as "wonPredictions",
                (
                    SELECT COALESCE(SUM(m."pointsReward"), 0) 
                    FROM predictions p 
                    JOIN markets m ON p."marketId" = m.id 
                    WHERE p."walletAddress" = u."walletAddress" 
                    AND p.status = 'WON' 
                    AND p."updatedAt" >= NOW() - INTERVAL '7 days'
                ) as "weeklyPoints"
            FROM users u
            ORDER BY u.points DESC
            LIMIT 50
        `;

        const leaderboardWithStats = leaderboard.map(user => {
            const totalPredictions = parseInt(user.totalPredictions) || 0;
            const wonPredictions = parseInt(user.wonPredictions) || 0;
            const winrate = totalPredictions > 0 ? Math.round((wonPredictions / totalPredictions) * 100) : 0;
            return {
                ...user,
                totalPredictions,
                wonPredictions,
                winrate,
                weeklyPoints: parseInt(user.weeklyPoints) || 0
            };
        });

        let userStats = null;
        if (walletAddress) {
            const userInTop10 = leaderboardWithStats.findIndex(u => u.walletAddress === walletAddress);
            if (userInTop10 !== -1) {
                userStats = { ...leaderboardWithStats[userInTop10], rank: userInTop10 + 1 };
            } else {
                const { rows: userRow } = await sql`
                    SELECT 
                        u."walletAddress", 
                        u.points, 
                        (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress") as "totalPredictions",
                        (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress" AND p.status = 'WON') as "wonPredictions",
                        (
                            SELECT COALESCE(SUM(m."pointsReward"), 0) 
                            FROM predictions p 
                            JOIN markets m ON p."marketId" = m.id 
                            WHERE p."walletAddress" = u."walletAddress" 
                            AND p.status = 'WON' 
                            AND p."updatedAt" >= NOW() - INTERVAL '7 days'
                        ) as "weeklyPoints",
                        (SELECT COUNT(*) + 1 FROM users u2 WHERE u2.points > u.points) as rank
                    FROM users u
                    WHERE u."walletAddress" = ${walletAddress}
                `;
                if (userRow.length > 0) {
                    const totalPredictions = parseInt(userRow[0].totalPredictions) || 0;
                    const wonPredictions = parseInt(userRow[0].wonPredictions) || 0;
                    userStats = {
                        ...userRow[0],
                        totalPredictions,
                        wonPredictions,
                        winrate: totalPredictions > 0 ? Math.round((wonPredictions / totalPredictions) * 100) : 0,
                        weeklyPoints: parseInt(userRow[0].weeklyPoints) || 0,
                        rank: parseInt(userRow[0].rank) || 0
                    };
                }
            }
        }

        return NextResponse.json({ success: true, leaderboard: leaderboardWithStats, userStats }, { status: 200 });
    } catch (error) {
        console.error("GET /api/leaderboard error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}

