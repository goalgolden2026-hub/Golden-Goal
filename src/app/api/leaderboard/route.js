import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const sql = await getDb();
        
        // Fetch top users by points
        const { rows: leaderboard } = await sql`
            SELECT "walletAddress", points, "betsToday"
            FROM users
            ORDER BY points DESC
            LIMIT 50
        `;

        return NextResponse.json({ success: true, leaderboard }, { status: 200 });
    } catch (error) {
        console.error("GET /api/leaderboard error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}
