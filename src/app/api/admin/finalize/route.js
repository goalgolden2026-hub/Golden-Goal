import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const { marketId, winningPrediction, signature } = body;

        if (!marketId || !winningPrediction) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        const sql = await getDb();
        
        // Update database and finalize market
        await sql`UPDATE markets SET status = ${'RESOLVED_' + winningPrediction} WHERE id = ${marketId}`;

        // Optional: signature (transaction tx) can be stored in the database for reference.
        
        return NextResponse.json({ 
            success: true, 
            message: "Market marked as resolved in database.",
            signature
        }, { status: 200 });

    } catch (error) {
        console.error("POST /api/admin/finalize error:", error);
        return NextResponse.json({ success: false, error: "Failed to finalize market" }, { status: 500 });
    }
}
