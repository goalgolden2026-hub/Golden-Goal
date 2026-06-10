import { NextResponse } from 'next/server';

const GOLDEN_GOAL_MINT = process.env.GOLDEN_GOAL_MINT || process.env.NEXT_PUBLIC_GOLDEN_GOAL_MINT || "GU527smM71ht8aCA8ouShfXhahVq6crz51FMbfZ8pump";
const CACHE_DURATION = 60 * 1000; // 60 seconds

let apiCache = {
    data: null,
    timestamp: 0
};

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const adminWallet = searchParams.get('wallet');

        if (!adminWallet) {
            return NextResponse.json({ success: false, error: "Missing admin wallet" }, { status: 400 });
        }

        // 1. Verify Admin Authority
        const adminWalletsString = process.env.ADMIN_WALLET || "";
        const authorizedWallets = adminWalletsString.split(',').map(w => w.trim()).filter(Boolean);
        if (!authorizedWallets.includes(adminWallet)) {
            return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
        }

        // 2. Check Cache
        const now = Date.now();
        if (apiCache.data && (now - apiCache.timestamp < CACHE_DURATION)) {
            return NextResponse.json({ success: true, fromCache: true, ...apiCache.data }, { status: 200 });
        }

        // 3. Verify Helius API Key
        const apiKey = process.env.HELIUS_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ 
                success: false, 
                error: "Helius API Key is not configured. Please add HELIUS_API_KEY in your env file." 
            }, { status: 400 });
        }

        // 4. Fetch parsed transactions from Helius (v0 Enhanced Transactions)
        const heliusUrl = `https://api.helius.xyz/v0/addresses/${GOLDEN_GOAL_MINT}/transactions?api-key=${apiKey}&limit=100`;
        const res = await fetch(heliusUrl);
        
        if (!res.ok) {
            throw new Error(`Helius API returned status: ${res.status}`);
        }

        const transactions = await res.json();
        
        // 5. Parse transactions
        const trades = [];
        let totalSolVolume = 0;
        let totalBuys = 0;
        let totalSells = 0;

        for (const tx of transactions) {
            const trader = tx.feePayer;
            const signature = tx.signature;
            const timestamp = tx.timestamp ? tx.timestamp * 1000 : Date.now();
            
            if (!tx.tokenTransfers) continue;

            const mintTransfers = tx.tokenTransfers.filter(t => t.mint === GOLDEN_GOAL_MINT);
            if (mintTransfers.length === 0) continue;

            let tokenAmount = 0;
            let isBuy = false;

            for (const t of mintTransfers) {
                tokenAmount += t.tokenAmount || 0;
                // If the tokens are sent to the trader, it's a BUY
                if (t.toUserAccount === trader) {
                    isBuy = true;
                }
            }

            // Find SOL (native) transfers
            let solAmount = 0;
            const nativeTransfers = tx.nativeTransfers || [];
            for (const n of nativeTransfers) {
                if (n.fromUserAccount === trader || n.toUserAccount === trader) {
                    solAmount += (n.amount || 0) / 1e9;
                }
            }

            // If no native SOL, check stablecoin (USDC/USDT) transfers
            if (solAmount === 0) {
                const stableTransfers = tx.tokenTransfers.filter(t => 
                    (t.mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' || t.mint === 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB') &&
                    (t.fromUserAccount === trader || t.toUserAccount === trader)
                );
                for (const s of stableTransfers) {
                    // Approximate stable value as SOL equivalent for display (e.g. 1 SOL = 175 USDC)
                    solAmount += (s.tokenAmount || 0) / 175;
                }
            }

            if (tokenAmount === 0) continue;

            const pricePerToken = tokenAmount > 0 ? (solAmount / tokenAmount) : 0;

            trades.push({
                signature,
                trader,
                timestamp,
                type: isBuy ? 'BUY' : 'SELL',
                tokenAmount,
                solAmount,
                pricePerToken
            });

            totalSolVolume += solAmount;
            if (isBuy) totalBuys++;
            else totalSells++;
        }

        // 6. Aggregate Top Buyers and Cost Basis
        const buyersMap = {};
        for (const t of trades) {
            if (t.type === 'BUY') {
                if (!buyersMap[t.trader]) {
                    buyersMap[t.trader] = {
                        wallet: t.trader,
                        totalSol: 0,
                        totalTokens: 0,
                        tradesCount: 0
                    };
                }
                buyersMap[t.trader].totalSol += t.solAmount;
                buyersMap[t.trader].totalTokens += t.tokenAmount;
                buyersMap[t.trader].tradesCount += 1;
            }
        }

        const topBuyers = Object.values(buyersMap)
            .map(b => ({
                wallet: b.wallet,
                totalSol: Number(b.totalSol.toFixed(4)),
                totalTokens: Math.round(b.totalTokens),
                tradesCount: b.tradesCount,
                avgPrice: b.totalTokens > 0 ? Number((b.totalSol / b.totalTokens).toFixed(9)) : 0
            }))
            .sort((a, b) => b.totalSol - a.totalSol)
            .slice(0, 20);

        // 7. Save Cache
        const resultData = {
            totalSolVolume: Number(totalSolVolume.toFixed(2)),
            totalBuys,
            totalSells,
            trades: trades.slice(0, 50), // Send latest 50 parsed trades
            topBuyers
        };

        apiCache = {
            data: resultData,
            timestamp: now
        };

        return NextResponse.json({ success: true, fromCache: false, ...resultData }, { status: 200 });

    } catch (error) {
        console.error("GET /api/admin/holder-analysis error:", error);
        return NextResponse.json({ success: false, error: "Failed to load holder and trade analysis." }, { status: 500 });
    }
}
