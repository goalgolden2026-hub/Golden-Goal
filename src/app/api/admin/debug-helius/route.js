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

        let transactions = [];
        let beforeSignature = '';
        const fourDaysAgo = Date.now() - 4 * 24 * 60 * 60 * 1000;
        let reachedLimit = false;
        let apiCalls = 0;
        const maxApiCalls = 50; // Fetch up to 50 pages (5000 transactions)

        while (!reachedLimit && apiCalls < maxApiCalls) {
            let heliusUrl = `https://api.helius.xyz/v0/addresses/${mint}/transactions?api-key=${apiKey}&limit=100`;
            if (beforeSignature) {
                heliusUrl += `&before=${beforeSignature}`;
            }
            
            const res = await fetch(heliusUrl);
            if (!res.ok) {
                throw new Error(`Helius API status: ${res.status}`);
            }
            
            const pageTxs = await res.json();
            if (!pageTxs || pageTxs.length === 0) {
                break;
            }
            
            transactions = transactions.concat(pageTxs);
            apiCalls++;
            
            const lastTx = pageTxs[pageTxs.length - 1];
            beforeSignature = lastTx?.signature || '';
            
            const lastTxTime = lastTx?.timestamp ? lastTx.timestamp * 1000 : Date.now();
            if (lastTxTime < fourDaysAgo || pageTxs.length < 100) {
                reachedLimit = true;
            }
        }

        // Filter for last 4 days
        const filteredTxs = transactions.filter(tx => (tx.timestamp ? tx.timestamp * 1000 : Date.now()) >= fourDaysAgo);

        return NextResponse.json({
            success: true,
            totalFetched: transactions.length,
            filteredCount: filteredTxs.length,
            apiCalls,
            reachedLimit,
            oldestTxTime: new Date(transactions[transactions.length - 1]?.timestamp * 1000).toLocaleString()
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
