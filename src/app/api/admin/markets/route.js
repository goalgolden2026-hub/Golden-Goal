import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const { title, category, endDate } = body;

        if (!title || !category || !endDate) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const sql = await getDb();
        
        await sql`
            INSERT INTO markets (title, category, "endDate", "poolSol", "rewardToken", "yesPercent", "noPercent", status) 
            VALUES (${title}, ${category}, ${endDate}, 0, 'GOLDEN', 50, 50, 'ACTIVE')
        `;

        return NextResponse.json({ success: true, message: "Market created successfully" }, { status: 201 });
    } catch (error) {
        console.error("POST /api/admin/markets error:", error);
        return NextResponse.json({ success: false, error: "Failed to create market" }, { status: 500 });
    }
}
