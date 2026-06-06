import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const sql = await getDb();
        const { rows } = await sql`SELECT * FROM markets WHERE id = ${id}`;
        
        if (rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Market not found' }, { status: 404 });
        }

        // Fetch prediction stats for this market
        const statsQuery = await sql`
            SELECT "predictionType", prediction, COUNT(*) as count 
            FROM predictions 
            WHERE "marketId" = ${id} 
            GROUP BY "predictionType", prediction
        `;

        const statsMap = {};
        statsQuery.rows.forEach(row => {
            const type = row.predictionType;
            const opt = row.prediction;
            const count = parseInt(row.count, 10);
            if (!statsMap[type]) {
                statsMap[type] = {};
            }
            statsMap[type][opt] = count;
        });
        
        return NextResponse.json({ 
            success: true, 
            market: rows[0],
            predictionStats: statsMap
        });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
