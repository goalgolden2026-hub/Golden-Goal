import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const url = new URL(request.url);
    const password = url.searchParams.get('pw');
    
    // Simple verification to prevent unauthorized access during the 10 seconds this file is live
    if (password !== 'revealme123') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
        HELIUS_API_KEY: process.env.HELIUS_API_KEY,
        GOLDEN_GOAL_MINT: process.env.GOLDEN_GOAL_MINT || process.env.NEXT_PUBLIC_GOLDEN_GOAL_MINT
    });
}
