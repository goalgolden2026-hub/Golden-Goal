import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const marketId = searchParams.get('marketId');
        if (!marketId) {
            return NextResponse.json({ success: false, error: "Missing marketId" }, { status: 400 });
        }

        const sql = await getDb();
        
        // Find distinct predictionTypes and their winning predictions where status is 'WON'
        const { rows } = await sql`
            SELECT DISTINCT "predictionType", prediction 
            FROM predictions 
            WHERE "marketId" = ${marketId} AND status = 'WON'
        `;

        const resolved = {};
        rows.forEach(r => {
            resolved[r.predictionType] = r.prediction;
        });

        return NextResponse.json({ success: true, resolved });
    } catch (e) {
        console.error("GET /api/admin/resolved-predictions error:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
