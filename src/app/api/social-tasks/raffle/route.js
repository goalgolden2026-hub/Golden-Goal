import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const sql = await getDb();

        // 1. Try to read from cache first (highly optimized O(1) query)
        const cacheRes = await sql`
            SELECT data 
            FROM live_scores_cache 
            WHERE key = 'social_raffle_stats'
        `;

        if (cacheRes.rowCount > 0) {
            // Serve cached data directly (saves heavy COUNT / DISTINCT query processing)
            return NextResponse.json({
                success: true,
                ...cacheRes.rows[0].data
            }, { status: 200 });
        }

        // 2. Cache miss -> perform calculation (only runs once on cold start or after a new tweet submission)
        const countRes = await sql`SELECT COUNT(*) as total FROM social_tasks`;
        const total = parseInt(countRes.rows[0].total) || 0;

        const uniqueRes = await sql`SELECT COUNT(DISTINCT "walletAddress") as unique_users FROM social_tasks`;
        const uniqueUsers = parseInt(uniqueRes.rows[0].unique_users) || 0;

        const winnersRes = await sql`
            SELECT id, "walletAddress", "raffleNumber", "prizeAmount", status, "createdAt" 
            FROM social_raffle_winners 
            ORDER BY "createdAt" DESC
        `;
        const winners = winnersRes.rows;

        const target = 1000;
        const remaining = target - (total % target);

        const raffleData = {
            total,
            uniqueUsers,
            target,
            remaining,
            winners
        };

        // 3. Write calculation back to cache
        await sql`
            INSERT INTO live_scores_cache (key, data, "updatedAt") 
            VALUES ('social_raffle_stats', ${JSON.stringify(raffleData)}, CURRENT_TIMESTAMP)
            ON CONFLICT (key) 
            DO UPDATE SET data = EXCLUDED.data, "updatedAt" = CURRENT_TIMESTAMP
        `;

        return NextResponse.json({
            success: true,
            ...raffleData
        }, { status: 200 });

    } catch (error) {
        console.error("GET /api/social-tasks/raffle error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch raffle data" }, { status: 500 });
    }
}
