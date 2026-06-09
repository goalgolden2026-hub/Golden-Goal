import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Keypair, Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

import { getSolanaConnection } from '@/lib/solana';

const GOLDEN_GOAL_MINT = process.env.GOLDEN_GOAL_MINT || process.env.NEXT_PUBLIC_GOLDEN_GOAL_MINT;
const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('walletAddress');

        const sql = await getDb();
        
        // Fetch Total Value Locked (TVL)
        const tvlRes = await sql`SELECT SUM(amount) as total FROM locks WHERE status = 'ACTIVE'`;
        const totalValueLocked = tvlRes.rows[0]?.total || 0;

        // Fetch Active Lockers (Unique wallets)
        const lockersRes = await sql`SELECT COUNT(DISTINCT "walletAddress") as count FROM locks WHERE status = 'ACTIVE'`;
        const activeLockers = lockersRes.rows[0]?.count || 0;

        // Fetch Active Lockers per Tier (Unique wallets)
        const tierCountsRes = await sql`
            SELECT tier, COUNT(DISTINCT "walletAddress") as count 
            FROM locks 
            WHERE status = 'ACTIVE' 
            GROUP BY tier
        `;
        const tierCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
        tierCountsRes.rows.forEach(row => {
            tierCounts[row.tier] = Number(row.count);
        });

        // Fetch User Locked (if wallet provided)
        let userLocked = 0;
        let activeLock = null;
        if (walletAddress) {
            const userLockRes = await sql`SELECT amount, tier, "unlockDate" FROM locks WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE'`;
            if (userLockRes.rowCount > 0) {
                userLocked = userLockRes.rows[0].amount;
                activeLock = {
                    tier: userLockRes.rows[0].tier,
                    unlockDate: userLockRes.rows[0].unlockDate
                };
            }
        }

        // Derive Stake Wallet from PAYOUT_DISTRIBUTOR_KEY env variable
        const secretKeyStr = process.env.PAYOUT_DISTRIBUTOR_KEY;
        let stakeWallet = "Fk3kDaJbh4dBHNfDyiquXTiKZmbVS8BQ8bLvDy4aeJwm"; // Default fallback
        if (secretKeyStr) {
            try {
                let secretKey;
                if (secretKeyStr.trim().startsWith('[')) {
                    secretKey = new Uint8Array(JSON.parse(secretKeyStr));
                } else {
                    const decodeFn = typeof bs58.decode === 'function' ? bs58.decode : bs58.default.decode;
                    secretKey = decodeFn(secretKeyStr.trim());
                }
                const kp = Keypair.fromSecretKey(secretKey);
                stakeWallet = kp.publicKey.toBase58();
            } catch (e) {
                console.error("Failed to parse PAYOUT_DISTRIBUTOR_KEY in stats route:", e.message);
            }
        }

        // Check if Stake Wallet Associated Token Account exists on-chain (wrapped in safe try-catch to avoid RPC 403 errors blocking page load)
        let stakeAtaExists = false;
        if (GOLDEN_GOAL_MINT) {
            try {
                const { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
                const connection = await getSolanaConnection();
                const mintPubKey = new PublicKey(GOLDEN_GOAL_MINT);
                const stakeWalletPubKey = new PublicKey(stakeWallet);
                const expectedATA = await getAssociatedTokenAddress(mintPubKey, stakeWalletPubKey, false, TOKEN_2022_PROGRAM_ID);
                const destAccountInfo = await connection.getAccountInfo(expectedATA);
                stakeAtaExists = !!destAccountInfo;
            } catch (e) {
                console.warn("Failed to check if Stake ATA exists on-chain (using fallback=true):", e.message);
                stakeAtaExists = true; // Default to true so we don't crash or attempt duplicate creation
            }
        } else {
            stakeAtaExists = true;
        }

        // Fetch event statistics
        const participantsRes = await sql`
            SELECT "walletAddress"
            FROM locks
            WHERE status = 'ACTIVE' AND tier IN (2, 3, 4)
            GROUP BY "walletAddress"
            ORDER BY MIN("createdAt") ASC
            LIMIT 100
        `;
        const participantWallets = participantsRes.rows.map(r => r.walletAddress);
        const isEventParticipant = walletAddress ? participantWallets.includes(walletAddress) : false;
        const userPosition = walletAddress ? participantWallets.indexOf(walletAddress) : -1;

        return NextResponse.json({ 
            success: true, 
            totalValueLocked: Number(totalValueLocked),
            activeLockers: Number(activeLockers),
            userLocked: Number(userLocked),
            activeLock: activeLock,
            tierCounts: tierCounts,
            stakeWallet: stakeWallet,
            stakeAtaExists: stakeAtaExists,
            isEventParticipant: isEventParticipant,
            userPosition: userPosition,
            totalParticipants: participantWallets.length
        }, { status: 200 });

    } catch (error) {
        console.error("GET /api/lock/stats error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
    }
}
