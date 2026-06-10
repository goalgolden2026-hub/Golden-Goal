import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get('wallet');
        const apiKey = process.env.HELIUS_API_KEY;
        const mint = "GU527smM71ht8aCA8ouShfXhahVq6crz51FMbfZ8pump";

        if (!apiKey) {
            return NextResponse.json({ error: "No API key" }, { status: 400 });
        }

        const heliusUrl = `https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${apiKey}&limit=100`;
        const res = await fetch(heliusUrl);
        if (!res.ok) {
            return NextResponse.json({ error: `Helius status ${res.status}` }, { status: 500 });
        }

        const txs = await res.json();
        
        // Filter transactions involving the mint
        const mintTxs = txs.filter(tx => {
            return tx.tokenTransfers && tx.tokenTransfers.some(t => t.mint === mint);
        }).map(tx => {
            return {
                signature: tx.signature,
                timestamp: tx.timestamp,
                feePayer: tx.feePayer,
                tokenTransfers: tx.tokenTransfers.filter(t => t.mint === mint),
                nativeTransfers: tx.nativeTransfers
            };
        });

        return NextResponse.json({ success: true, count: mintTxs.length, transactions: mintTxs });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
