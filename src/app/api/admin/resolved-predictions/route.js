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
        
        // 1. Fetch market to get resolvedOutcomes JSON
        const marketRes = await sql`SELECT "resolvedOutcomes" FROM markets WHERE id = ${marketId}`;
        let resolved = {};
        
        if (marketRes.rowCount > 0 && marketRes.rows[0].resolvedOutcomes) {
            try {
                resolved = JSON.parse(marketRes.rows[0].resolvedOutcomes);
            } catch (e) {
                console.error("Error parsing market resolvedOutcomes:", e);
            }
        }

        // 2. Fetch distinct WON predictions as a fallback/merge for backward compatibility
        const { rows: wonRows } = await sql`
            SELECT DISTINCT "predictionType", prediction 
            FROM predictions 
            WHERE "marketId" = ${marketId} AND status = 'WON'
        `;
        
        wonRows.forEach(r => {
            if (resolved[r.predictionType] === undefined) {
                resolved[r.predictionType] = r.prediction;
            }
        });

        return NextResponse.json({ success: true, resolved });
    } catch (e) {
        console.error("GET /api/admin/resolved-predictions error:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
