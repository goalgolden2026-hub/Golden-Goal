import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const apiKey = process.env.HELIUS_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ success: false, error: "Missing HELIUS_API_KEY" });
        }

        const url = new URL(request.url);
        const sig = url.searchParams.get('sig') || "qTJ8B7ZfF1yeBQmWYcYwwybpjg6KQVGeCBJy5L8tr8mvyqS7E5pNGxYSY3pxUXDZP8w1MevTXBQmmwJbanXYwiD";

        const heliusUrl = `https://api.helius.xyz/v0/transactions/?api-key=${apiKey}`;
        const res = await fetch(heliusUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactions: [sig] })
        });

        if (!res.ok) {
            return NextResponse.json({ success: false, status: res.status, error: "Helius API call failed" });
        }

        const data = await res.json();
        return NextResponse.json({ success: true, tx: data[0] });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
