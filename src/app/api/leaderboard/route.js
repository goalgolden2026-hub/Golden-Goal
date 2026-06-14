import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const WEEK_1_START = new Date("2026-06-11T00:00:00+03:00");

const getActiveWeek = (date = new Date()) => {
    const diffTime = date.getTime() - WEEK_1_START.getTime();
    if (diffTime < 0) return 0; // Not started yet
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1; // 1-indexed week
};

const getWeekDateRange = (w) => {
    const start = new Date(WEEK_1_START.getTime() + (w - 1) * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1000); // 7 days later minus 1 second
    return { start, end };
};

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('walletAddress');
        const weekParam = searchParams.get('week');

        const sql = await getDb();
        
        // Calculate the current active week
        const currentActiveWeek = getActiveWeek(new Date());

        // Default to current active week (or 1 if not started yet)
        const week = weekParam ? parseInt(weekParam) : (currentActiveWeek > 0 ? currentActiveWeek : 1);

        const range = getWeekDateRange(week);
        const queryWeekStart = range.start.toISOString();
        const queryWeekEnd = range.end.toISOString();

        // Fetch top users by weekly points (won predictions + box XP wins in range)
        const { rows: leaderboard } = await sql`
            SELECT 
                u."walletAddress", 
                u.points as "totalPoints", 
                u."predictionsToday",
                (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress") as "totalPredictions",
                (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress" AND p.status = 'WON') as "wonPredictions",
                (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress" AND p.status IN ('WON', 'LOST')) as "resolvedPredictions",
                (
                    (
                        SELECT COALESCE(SUM(p."pointsReward"), 0) 
                        FROM predictions p 
                        WHERE p."walletAddress" = u."walletAddress" 
                        AND p.status = 'WON' 
                        AND p."updatedAt" >= ${queryWeekStart}::timestamp
                        AND p."updatedAt" <= ${queryWeekEnd}::timestamp
                    ) + (
                        SELECT COALESCE(SUM(t.amount), 0) 
                        FROM treasury_logs t 
                        WHERE t."walletAddress" = u."walletAddress" 
                        AND t.type IN ('REWARDS_BOX_WIN_XP', 'REWARDS_BOX_OPEN_XP')
                        AND t.timestamp >= ${queryWeekStart}::timestamp
                        AND t.timestamp <= ${queryWeekEnd}::timestamp
                    )
                ) as "weeklyPoints"
            FROM users u
            ORDER BY (
                (
                    SELECT COALESCE(SUM(p."pointsReward"), 0) 
                    FROM predictions p 
                    WHERE p."walletAddress" = u."walletAddress" 
                    AND p.status = 'WON' 
                    AND p."updatedAt" >= ${queryWeekStart}::timestamp
                    AND p."updatedAt" <= ${queryWeekEnd}::timestamp
                ) + (
                    SELECT COALESCE(SUM(t.amount), 0) 
                    FROM treasury_logs t 
                    WHERE t."walletAddress" = u."walletAddress" 
                    AND t.type IN ('REWARDS_BOX_WIN_XP', 'REWARDS_BOX_OPEN_XP')
                    AND t.timestamp >= ${queryWeekStart}::timestamp
                    AND t.timestamp <= ${queryWeekEnd}::timestamp
                )
            ) DESC, u.points DESC
            LIMIT 10
        `;

        const leaderboardWithStats = leaderboard.map(user => {
            const totalPredictions = parseInt(user.totalPredictions) || 0;
            const wonPredictions = parseInt(user.wonPredictions) || 0;
            const resolvedPredictions = parseInt(user.resolvedPredictions) || 0;
            const winrate = resolvedPredictions > 0 ? Math.round((wonPredictions / resolvedPredictions) * 100) : 0;
            return {
                ...user,
                points: parseInt(user.weeklyPoints) || 0, // In the simplified dashboard, points displays the weekly score
                totalPoints: parseInt(user.totalPoints) || 0,
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
                        u.points as "totalPoints", 
                        (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress") as "totalPredictions",
                        (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress" AND p.status = 'WON') as "wonPredictions",
                        (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress" AND p.status IN ('WON', 'LOST')) as "resolvedPredictions",
                        (
                            (
                                SELECT COALESCE(SUM(p."pointsReward"), 0) 
                                FROM predictions p 
                                WHERE p."walletAddress" = u."walletAddress" 
                                AND p.status = 'WON' 
                                AND p."updatedAt" >= ${queryWeekStart}::timestamp
                                AND p."updatedAt" <= ${queryWeekEnd}::timestamp
                            ) + (
                                SELECT COALESCE(SUM(t.amount), 0) 
                                FROM treasury_logs t 
                                WHERE t."walletAddress" = u."walletAddress" 
                                AND t.type IN ('REWARDS_BOX_WIN_XP', 'REWARDS_BOX_OPEN_XP')
                                AND t.timestamp >= ${queryWeekStart}::timestamp
                                AND t.timestamp <= ${queryWeekEnd}::timestamp
                            )
                        ) as "weeklyPoints",
                        (
                            SELECT COUNT(*) + 1 
                            FROM (
                                SELECT 
                                    u2."walletAddress",
                                    (
                                        (
                                            SELECT COALESCE(SUM(p2."pointsReward"), 0)
                                            FROM predictions p2
                                            WHERE p2."walletAddress" = u2."walletAddress"
                                            AND p2.status = 'WON'
                                            AND p2."updatedAt" >= ${queryWeekStart}::timestamp
                                            AND p2."updatedAt" <= ${queryWeekEnd}::timestamp
                                        ) + (
                                            SELECT COALESCE(SUM(t2.amount), 0)
                                            FROM treasury_logs t2
                                            WHERE t2."walletAddress" = u2."walletAddress"
                                            AND t2.type IN ('REWARDS_BOX_WIN_XP', 'REWARDS_BOX_OPEN_XP')
                                            AND t2.timestamp >= ${queryWeekStart}::timestamp
                                            AND t2.timestamp <= ${queryWeekEnd}::timestamp
                                        )
                                    ) as wp
                                FROM users u2
                            ) sub
                            WHERE sub.wp > (
                                (
                                    SELECT COALESCE(SUM(p3."pointsReward"), 0)
                                    FROM predictions p3
                                    WHERE p3."walletAddress" = u."walletAddress"
                                    AND p3.status = 'WON'
                                    AND p3."updatedAt" >= ${queryWeekStart}::timestamp
                                    AND p3."updatedAt" <= ${queryWeekEnd}::timestamp
                                ) + (
                                    SELECT COALESCE(SUM(t3.amount), 0)
                                    FROM treasury_logs t3
                                    WHERE t3."walletAddress" = u."walletAddress"
                                    AND t3.type IN ('REWARDS_BOX_WIN_XP', 'REWARDS_BOX_OPEN_XP')
                                    AND t3.timestamp >= ${queryWeekStart}::timestamp
                                    AND t3.timestamp <= ${queryWeekEnd}::timestamp
                                )
                            )
                        ) as rank
                    FROM users u
                    WHERE u."walletAddress" = ${walletAddress}
                `;

                if (userRow.length > 0) {
                    const totalPredictions = parseInt(userRow[0].totalPredictions) || 0;
                    const wonPredictions = parseInt(userRow[0].wonPredictions) || 0;
                    const resolvedPredictions = parseInt(userRow[0].resolvedPredictions) || 0;
                    userStats = {
                        ...userRow[0],
                        totalPredictions,
                        wonPredictions,
                        winrate: resolvedPredictions > 0 ? Math.round((wonPredictions / resolvedPredictions) * 100) : 0,
                        points: parseInt(userRow[0].weeklyPoints) || 0,
                        totalPoints: parseInt(userRow[0].totalPoints) || 0,
                        weeklyPoints: parseInt(userRow[0].weeklyPoints) || 0,
                        rank: parseInt(userRow[0].rank) || 0
                    };
                }
            }
        }

        return NextResponse.json({ success: true, leaderboard: leaderboardWithStats, userStats, activeWeek: week }, { status: 200 });
    } catch (error) {
        console.error("GET /api/leaderboard error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}

