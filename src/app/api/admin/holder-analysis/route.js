import { NextResponse } from 'next/server';

const GOLDEN_GOAL_MINT = process.env.GOLDEN_GOAL_MINT || process.env.NEXT_PUBLIC_GOLDEN_GOAL_MINT || "GU527smM71ht8aCA8ouShfXhahVq6crz51FMbfZ8pump";
const CACHE_DURATION = 120 * 1000; // 120 seconds (2 minutes)

let apiCache = {
    data: null,
    timestamp: 0
};

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const adminWallet = searchParams.get('wallet');
        const forceRefresh = searchParams.get('refresh') === 'true';

        if (!adminWallet) {
            return NextResponse.json({ success: false, error: "Missing admin wallet" }, { status: 400 });
        }

        // 1. Verify Admin Authority
        const adminWalletsString = process.env.ADMIN_WALLET || "";
        const authorizedWallets = adminWalletsString.split(',').map(w => w.trim()).filter(Boolean);
        
        const hardcodedAdmins = [
            "2iF2q7hjEqEe8o6PTdJnYRYZUCeaMDjD35tSrKbu5R8K",
            "HMsWAhRC9wom6JVBpuo2gjAGp7Sb59FEyMraLpC4YXGc",
            "5HFHidgXqhe7o56QziENpfRDta1txJpHEU16cCoMWejh"
        ];
        
        if (!authorizedWallets.includes(adminWallet) && !hardcodedAdmins.includes(adminWallet)) {
            return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
        }

        // 2. Check Cache
        const now = Date.now();
        if (!forceRefresh && apiCache.data && (now - apiCache.timestamp < CACHE_DURATION)) {
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

        // 3.5. Fetch SOL price in USD from CoinGecko
        let solPrice = 63.5; // fallback
        try {
            const solPriceRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", { next: { revalidate: 60 } });
            if (solPriceRes.ok) {
                const solPriceData = await solPriceRes.json();
                const priceVal = solPriceData?.solana?.usd;
                if (priceVal) {
                    solPrice = Number(priceVal);
                }
            }
        } catch (priceErr) {
            console.error("Failed to fetch SOL price from CoinGecko, using fallback", priceErr);
        }

        // 4. Fetch parsed transactions from Helius with pagination since June 5th, 2026
        let transactions = [];
        let beforeSignature = '';
        const juneFifth = new Date('2026-06-05T00:00:00+03:00').getTime(); // Launch date TR time
        let reachedLimit = false;
        let apiCalls = 0;
        const maxApiCalls = 30; // Guard rails to stay strictly under Vercel 10s Hobby timeout limit (up to 3,000 txs)
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        while (!reachedLimit && apiCalls < maxApiCalls) {
            let heliusUrl = `https://api.helius.xyz/v0/addresses/${GOLDEN_GOAL_MINT}/transactions?api-key=${apiKey}&limit=100`;
            if (beforeSignature) {
                heliusUrl += `&before=${beforeSignature}`;
            }
            
            // Bypass Next.js data cache to fetch real-time on-chain data
            const res = await fetch(heliusUrl, { cache: 'no-store' });
            if (!res.ok) {
                if (res.status === 429) {
                    console.log('Rate limited on holder-analysis, sleeping 500ms...');
                    await delay(500);
                    continue; // Retry
                }
                throw new Error(`Helius API returned status: ${res.status}`);
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
            if (lastTxTime < juneFifth || pageTxs.length < 100) {
                reachedLimit = true;
            }
            
            // Limit rate to stay under the 10 RPS developer plan limit
            await delay(45);
        }
        
        // 5. Parse transactions and filter since June 5th, 2026
        const trades = [];
        let totalSolVolume = 0;
        let totalBuys = 0;
        let totalSells = 0;

        for (const tx of transactions) {
            const timestamp = tx.timestamp ? tx.timestamp * 1000 : Date.now();
            // Filter strictly inside the target window (since launch)
            if (timestamp < juneFifth) continue;

            const trader = tx.feePayer;
            const signature = tx.signature;
            
            if (!tx.tokenTransfers) continue;

            const mintTransfers = tx.tokenTransfers.filter(t => t.mint === GOLDEN_GOAL_MINT);
            if (mintTransfers.length === 0) continue;

            // Deduplicate transfers to prevent double counting from Helius outer/inner parsing
            const uniqueTransfers = [];
            for (const t of mintTransfers) {
                const isDuplicate = uniqueTransfers.some(u => 
                    u.fromUserAccount === t.fromUserAccount &&
                    u.toUserAccount === t.toUserAccount &&
                    u.tokenAmount === t.tokenAmount
                );
                if (!isDuplicate) {
                    uniqueTransfers.push(t);
                }
            }

            let tokensReceived = 0;
            let tokensSent = 0;

            for (const t of uniqueTransfers) {
                if (t.toUserAccount === trader) {
                    tokensReceived += t.tokenAmount || 0;
                }
                if (t.fromUserAccount === trader) {
                    tokensSent += t.tokenAmount || 0;
                }
            }

            const netAmount = tokensReceived - tokensSent;
            let tokenAmount = 0;
            let isBuy = false;

            if (netAmount > 0) {
                tokenAmount = netAmount;
                isBuy = true;
            } else if (netAmount < 0) {
                tokenAmount = Math.abs(netAmount);
                isBuy = false;
            } else {
                continue;
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
            .map(b => {
                const avgPrice = b.totalTokens > 0 ? b.totalSol / b.totalTokens : 0;
                const avgPriceUsd = avgPrice * solPrice;
                const avgMarketCap = avgPriceUsd * 1000000000;
                return {
                    wallet: b.wallet,
                    totalSol: Number(b.totalSol.toFixed(4)),
                    totalTokens: Math.round(b.totalTokens),
                    tradesCount: b.tradesCount,
                    avgPrice: Number(avgPrice.toFixed(9)),
                    avgPriceUsd: Number(avgPriceUsd.toFixed(6)),
                    avgMarketCap: Math.round(avgMarketCap)
                };
            })
            .sort((a, b) => b.totalSol - a.totalSol)
            .slice(0, 100);

        // 7. Save Cache
        const resultData = {
            solPrice,
            totalSolVolume: Number(totalSolVolume.toFixed(2)),
            totalBuys,
            totalSells,
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
