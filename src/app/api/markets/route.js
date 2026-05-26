import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const sql = await getDb();
        const { rows } = await sql`SELECT * FROM markets ORDER BY "matchDate" ASC`;
        
        return NextResponse.json({ success: true, markets: rows }, { status: 200 });
    } catch (error) {
        console.error("GET /api/markets error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch markets" }, { status: 500 });
    }
}
