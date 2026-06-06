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
        const week = weekParam ? parseInt(weekParam) : null;

        const sql = await getDb();
        
        // Calculate the current active week
        const currentActiveWeek = getActiveWeek(new Date());

        let queryWeekStart = null;
        let queryWeekEnd = null;

        if (week) {
            const range = getWeekDateRange(week);
            queryWeekStart = range.start.toISOString();
            queryWeekEnd = range.end.toISOString();
        } else if (currentActiveWeek > 0) {
            // For ALL tab, display weekly points of the current active week
            const range = getWeekDateRange(currentActiveWeek);
            queryWeekStart = range.start.toISOString();
            queryWeekEnd = range.end.toISOString();
        }

        // Fetch top users by points
        let leaderboard;
        if (week) {
            // Filter by specific week: order by that week's points descending
            const { rows } = await sql`
                SELECT 
                    u."walletAddress", 
                    u.points as "totalPoints", 
                    u."predictionsToday",
                    (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress") as "totalPredictions",
                    (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress" AND p.status = 'WON') as "wonPredictions",
                    (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress" AND p.status IN ('WON', 'LOST')) as "resolvedPredictions",
                    (
                        SELECT COALESCE(SUM(p."pointsReward"), 0) 
                        FROM predictions p 
                        WHERE p."walletAddress" = u."walletAddress" 
                        AND p.status = 'WON' 
                        AND p."updatedAt" >= ${queryWeekStart}::timestamp
                        AND p."updatedAt" <= ${queryWeekEnd}::timestamp
                    ) as "weeklyPoints"
                FROM users u
                ORDER BY (
                    SELECT COALESCE(SUM(p."pointsReward"), 0) 
                    FROM predictions p 
                    WHERE p."walletAddress" = u."walletAddress" 
                    AND p.status = 'WON' 
                    AND p."updatedAt" >= ${queryWeekStart}::timestamp
                    AND p."updatedAt" <= ${queryWeekEnd}::timestamp
                ) DESC, u.points DESC
                LIMIT 10
            `;
            leaderboard = rows;
        } else {
            // ALL: order by total points descending
            if (queryWeekStart && queryWeekEnd) {
                const { rows } = await sql`
                    SELECT 
                        u."walletAddress", 
                        u.points as "totalPoints", 
                        u."predictionsToday",
                        (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress") as "totalPredictions",
                        (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress" AND p.status = 'WON') as "wonPredictions",
                        (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress" AND p.status IN ('WON', 'LOST')) as "resolvedPredictions",
                        (
                            SELECT COALESCE(SUM(p."pointsReward"), 0) 
                            FROM predictions p 
                            WHERE p."walletAddress" = u."walletAddress" 
                            AND p.status = 'WON' 
                            AND p."updatedAt" >= ${queryWeekStart}::timestamp
                            AND p."updatedAt" <= ${queryWeekEnd}::timestamp
                        ) as "weeklyPoints"
                    FROM users u
                    ORDER BY u.points DESC
                    LIMIT 10
                `;
                leaderboard = rows;
            } else {
                const { rows } = await sql`
                    SELECT 
                        u."walletAddress", 
                        u.points as "totalPoints", 
                        u."predictionsToday",
                        (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress") as "totalPredictions",
                        (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress" AND p.status = 'WON') as "wonPredictions",
                        (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress" AND p.status IN ('WON', 'LOST')) as "resolvedPredictions",
                        0 as "weeklyPoints"
                    FROM users u
                    ORDER BY u.points DESC
                    LIMIT 10
                `;
                leaderboard = rows;
            }
        }

        const leaderboardWithStats = leaderboard.map(user => {
            const totalPredictions = parseInt(user.totalPredictions) || 0;
            const wonPredictions = parseInt(user.wonPredictions) || 0;
            const resolvedPredictions = parseInt(user.resolvedPredictions) || 0;
            const winrate = resolvedPredictions > 0 ? Math.round((wonPredictions / resolvedPredictions) * 100) : 0;
            return {
                ...user,
                points: parseInt(user.totalPoints) || 0,
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
                let userRow;
                if (week) {
                    const { rows } = await sql`
                        SELECT 
                            u."walletAddress", 
                            u.points as "totalPoints", 
                            (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress") as "totalPredictions",
                            (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress" AND p.status = 'WON') as "wonPredictions",
                            (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress" AND p.status IN ('WON', 'LOST')) as "resolvedPredictions",
                            (
                                SELECT COALESCE(SUM(p."pointsReward"), 0) 
                                FROM predictions p 
                                WHERE p."walletAddress" = u."walletAddress" 
                                AND p.status = 'WON' 
                                AND p."updatedAt" >= ${queryWeekStart}::timestamp
                                AND p."updatedAt" <= ${queryWeekEnd}::timestamp
                            ) as "weeklyPoints",
                            (
                                SELECT COUNT(*) + 1 
                                FROM (
                                    SELECT 
                                        u2."walletAddress",
                                        (
                                            SELECT COALESCE(SUM(p2."pointsReward"), 0)
                                            FROM predictions p2
                                            WHERE p2."walletAddress" = u2."walletAddress"
                                            AND p2.status = 'WON'
                                            AND p2."updatedAt" >= ${queryWeekStart}::timestamp
                                            AND p2."updatedAt" <= ${queryWeekEnd}::timestamp
                                        ) as wp
                                    FROM users u2
                                ) sub
                                WHERE sub.wp > (
                                    SELECT COALESCE(SUM(p3."pointsReward"), 0)
                                    FROM predictions p3
                                    WHERE p3."walletAddress" = u."walletAddress"
                                    AND p3.status = 'WON'
                                    AND p3."updatedAt" >= ${queryWeekStart}::timestamp
                                    AND p3."updatedAt" <= ${queryWeekEnd}::timestamp
                                )
                            ) as rank
                        FROM users u
                        WHERE u."walletAddress" = ${walletAddress}
                    `;
                    userRow = rows;
                } else {
                    if (queryWeekStart && queryWeekEnd) {
                        const { rows } = await sql`
                            SELECT 
                                u."walletAddress", 
                                u.points as "totalPoints", 
                                (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress") as "totalPredictions",
                                (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress" AND p.status = 'WON') as "wonPredictions",
                                (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress" AND p.status IN ('WON', 'LOST')) as "resolvedPredictions",
                                (
                                    SELECT COALESCE(SUM(p."pointsReward"), 0) 
                                    FROM predictions p 
                                    WHERE p."walletAddress" = u."walletAddress" 
                                    AND p.status = 'WON' 
                                    AND p."updatedAt" >= ${queryWeekStart}::timestamp
                                    AND p."updatedAt" <= ${queryWeekEnd}::timestamp
                                ) as "weeklyPoints",
                                (SELECT COUNT(*) + 1 FROM users u2 WHERE u2.points > u.points) as rank
                            FROM users u
                            WHERE u."walletAddress" = ${walletAddress}
                        `;
                        userRow = rows;
                    } else {
                        const { rows } = await sql`
                            SELECT 
                                u."walletAddress", 
                                u.points as "totalPoints", 
                                (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress") as "totalPredictions",
                                (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress" AND p.status = 'WON') as "wonPredictions",
                                (SELECT COUNT(*) FROM predictions p WHERE p."walletAddress" = u."walletAddress" AND p.status IN ('WON', 'LOST')) as "resolvedPredictions",
                                0 as "weeklyPoints",
                                (SELECT COUNT(*) + 1 FROM users u2 WHERE u2.points > u.points) as rank
                            FROM users u
                            WHERE u."walletAddress" = ${walletAddress}
                        `;
                        userRow = rows;
                    }
                }

                if (userRow.length > 0) {
                    const totalPredictions = parseInt(userRow[0].totalPredictions) || 0;
                    const wonPredictions = parseInt(userRow[0].wonPredictions) || 0;
                    const resolvedPredictions = parseInt(userRow[0].resolvedPredictions) || 0;
                    userStats = {
                        ...userRow[0],
                        totalPredictions,
                        wonPredictions,
                        winrate: resolvedPredictions > 0 ? Math.round((wonPredictions / resolvedPredictions) * 100) : 0,
                        points: parseInt(userRow[0].totalPoints) || 0,
                        totalPoints: parseInt(userRow[0].totalPoints) || 0,
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

