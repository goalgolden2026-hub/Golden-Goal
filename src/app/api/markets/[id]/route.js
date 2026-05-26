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
        
        return NextResponse.json({ success: true, market: rows[0] });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
