import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const revalidate = 0; // Disable cache

export async function GET() {
    try {
        const sql = await getDb();
        
        // Fetch top 10 users by socialPoints
        const res = await sql`
            SELECT "walletAddress", "socialPoints" 
            FROM users 
            WHERE "socialPoints" > 0 
            ORDER BY "socialPoints" DESC 
            LIMIT 10
        `;

        return NextResponse.json({ success: true, leaderboard: res.rows }, { status: 200 });
    } catch (error) {
        console.error("GET /api/leaderboard/social error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch social leaderboard" }, { status: 500 });
    }
}
