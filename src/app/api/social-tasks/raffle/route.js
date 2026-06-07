import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const sql = await getDb();

        // 1. Fetch total submissions count
        const countRes = await sql`SELECT COUNT(*) as total FROM social_tasks`;
        const total = parseInt(countRes.rows[0].total) || 0;

        // 2. Fetch unique wallets participant count
        const uniqueRes = await sql`SELECT COUNT(DISTINCT "walletAddress") as unique_users FROM social_tasks`;
        const uniqueUsers = parseInt(uniqueRes.rows[0].unique_users) || 0;

        // 3. Fetch raffle winners list
        const winnersRes = await sql`
            SELECT id, "walletAddress", "raffleNumber", "prizeAmount", status, "createdAt" 
            FROM social_raffle_winners 
            ORDER BY "createdAt" DESC
        `;
        const winners = winnersRes.rows;

        const target = 1000;
        const remaining = target - (total % target);

        return NextResponse.json({
            success: true,
            total,
            uniqueUsers,
            target,
            remaining,
            winners
        }, { status: 200 });

    } catch (error) {
        console.error("GET /api/social-tasks/raffle error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch raffle data" }, { status: 500 });
    }
}
