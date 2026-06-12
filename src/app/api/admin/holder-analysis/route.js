export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { getDb } from '@/lib/db';

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

        // 4. Fetch parsed transactions from Helius since the last synced transaction signature
        const sql = await getDb();
        const { rows: lastStoredTrade } = await sql`
            SELECT signature, timestamp FROM trader_trades 
            ORDER BY timestamp DESC LIMIT 1
        `;
        const lastSignature = lastStoredTrade.length > 0 ? lastStoredTrade[0].signature : null;
        const lastTimestamp = lastStoredTrade.length > 0 ? Number(lastStoredTrade[0].timestamp) : 0;

        let transactions = [];
        let beforeSignature = '';
        const juneFifth = new Date('2026-06-05T00:00:00+03:00').getTime(); // Launch date TR time
        let reachedLimit = false;
        let reachedStored = false;
        let apiCalls = 0;
        const maxApiCalls = 50; // High limit to pull all trades on initial sync/backfill
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        while (!reachedLimit && !reachedStored && apiCalls < maxApiCalls) {
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

            for (const tx of pageTxs) {
                if (tx.signature === lastSignature) {
                    reachedStored = true;
                    break;
                }
                transactions.push(tx);
            }

            if (reachedStored) {
                break;
            }
            
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
        
        // 5. Parse new transactions and filter since June 5th, 2026
        const newTrades = [];
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

            newTrades.push({
                signature,
                trader,
                timestamp,
                type: isBuy ? 'BUY' : 'SELL',
                tokenAmount,
                solAmount,
                pricePerToken
            });
        }

        // Save new trades to the database
        if (newTrades.length > 0) {
            // Save in chronological order (oldest first) so that timestamps build sequentially
            const sortedNewTrades = [...newTrades].sort((a, b) => a.timestamp - b.timestamp);
            for (const t of sortedNewTrades) {
                try {
                    await sql`
                        INSERT INTO trader_trades (signature, trader, timestamp, type, token_amount, sol_amount, price_per_token)
                        VALUES (${t.signature}, ${t.trader}, ${t.timestamp}, ${t.type}, ${t.tokenAmount}, ${t.solAmount}, ${t.pricePerToken})
                        ON CONFLICT (signature) DO NOTHING
                    `;
                } catch (dbErr) {
                    console.error(`Failed to store trade ${t.signature}:`, dbErr.message);
                }
            }
        }

        // Query all historical trades from the database for aggregation
        const { rows: allTrades } = await sql`
            SELECT trader, type, token_amount, sol_amount 
            FROM trader_trades
            WHERE timestamp >= ${juneFifth}
        `;

        // 6. Aggregate Top Buyers and Cost Basis (Net of Buys and Sells)
        const buyersMap = {};
        let totalSolVolume = 0;
        let totalBuys = 0;
        let totalSells = 0;

        for (const t of allTrades) {
            const trader = t.trader;
            if (!buyersMap[trader]) {
                buyersMap[trader] = {
                    wallet: trader,
                    totalSolSpent: 0,
                    totalSolReceived: 0,
                    tokensBought: 0,
                    tokensSold: 0,
                    tradesCount: 0
                };
            }
            
            buyersMap[trader].tradesCount += 1;
            
            if (t.type === 'BUY') {
                buyersMap[trader].totalSolSpent += t.sol_amount;
                buyersMap[trader].tokensBought += t.token_amount;
                totalSolVolume += t.sol_amount;
                totalBuys++;
            } else {
                buyersMap[trader].totalSolReceived += t.sol_amount;
                buyersMap[trader].tokensSold += t.token_amount;
                totalSolVolume += t.sol_amount;
                totalSells++;
            }
        }

        const candidateBuyers = Object.values(buyersMap)
            .map(b => {
                return {
                    wallet: b.wallet,
                    totalSol: Number(b.totalSolSpent.toFixed(4)),
                    tradesCount: b.tradesCount,
                    tokensBought: b.tokensBought,
                    tokensSold: b.tokensSold
                };
            })
            .sort((a, b) => b.totalSol - a.totalSol)
            .slice(0, 100);

        // 6.5 Fetch actual on-chain balances for the top 100 candidate wallets
        let topBuyers = [];
        try {
            const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
            const connection = new Connection(rpcUrl, 'confirmed');
            const mintPubKey = new PublicKey(GOLDEN_GOAL_MINT);
            
            const candidatesWithATAs = candidateBuyers.map(c => {
                try {
                    const ownerPubKey = new PublicKey(c.wallet);
                    const ata = getAssociatedTokenAddressSync(mintPubKey, ownerPubKey, false, TOKEN_2022_PROGRAM_ID);
                    return { ...c, ata };
                } catch (e) {
                    return null;
                }
            }).filter(Boolean);

            if (candidatesWithATAs.length > 0) {
                const ataKeys = candidatesWithATAs.map(c => c.ata);
                const accountsInfo = await connection.getMultipleAccountsInfo(ataKeys);
                
                for (let i = 0; i < candidatesWithATAs.length; i++) {
                    const candidate = candidatesWithATAs[i];
                    const info = accountsInfo[i];
                    
                    let onChainBalance = 0;
                    if (info && info.data && info.data.length >= 72) {
                        try {
                            const rawAmount = info.data.readBigUInt64LE(64);
                            onChainBalance = Number(rawAmount) / 1e6;
                        } catch (err) {
                            console.error(`Failed to parse account data for ${candidate.wallet}:`, err);
                        }
                    }

                    // Exclude wallets with no tokens
                    if (onChainBalance < 1) {
                        continue;
                    }

                    const avgPrice = onChainBalance > 0 ? candidate.totalSol / onChainBalance : 0;
                    const avgPriceUsd = avgPrice * solPrice;
                    const avgMarketCap = avgPriceUsd * 1000000000;

                    topBuyers.push({
                        wallet: candidate.wallet,
                        totalSol: candidate.totalSol,
                        totalTokens: Math.round(onChainBalance),
                        tradesCount: candidate.tradesCount,
                        avgPrice: Number(avgPrice.toFixed(9)),
                        avgPriceUsd: Number(avgPriceUsd.toFixed(6)),
                        avgMarketCap: Math.round(avgMarketCap)
                    });
                }
            }
            
            // Sort by totalSol again in case any were skipped
            topBuyers.sort((a, b) => b.totalSol - a.totalSol);
        } catch (rpcErr) {
            console.error("Failed to query on-chain balances, falling back to swap aggregation estimation:", rpcErr);
            topBuyers = candidateBuyers.map(c => {
                const netTokens = c.tokensBought - c.tokensSold;
                if (netTokens <= 0) return null;
                const avgPrice = netTokens > 0 ? c.totalSol / netTokens : 0;
                const avgPriceUsd = avgPrice * solPrice;
                const avgMarketCap = avgPriceUsd * 1000000000;
                return {
                    wallet: c.wallet,
                    totalSol: c.totalSol,
                    totalTokens: Math.round(netTokens),
                    tradesCount: c.tradesCount,
                    avgPrice: Number(avgPrice.toFixed(9)),
                    avgPriceUsd: Number(avgPriceUsd.toFixed(6)),
                    avgMarketCap: Math.round(avgMarketCap)
                };
            }).filter(Boolean);
        }

        // 7. Save Cache
        const resultData = {
            solPrice,
            totalSolVolume: Number(totalSolVolume.toFixed(2)),
            totalBuys,
            totalSells,
            topBuyers,
            envKeys: Object.keys(process.env)
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
