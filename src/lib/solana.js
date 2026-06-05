import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { isWalletWhitelisted } from './whitelist';

const GOLDEN_GOAL_MINT = process.env.GOLDEN_GOAL_MINT || process.env.NEXT_PUBLIC_GOLDEN_GOAL_MINT;

const SOLANA_RPCS = [
    "https://solana.publicnode.com",
    "https://api.mainnet-beta.solana.com"
];

export async function getSolanaConnection() {
    for (const rpcUrl of SOLANA_RPCS) {
        try {
            const connection = new Connection(rpcUrl, 'confirmed');
            // Quick test connection
            await connection.getLatestBlockhash('confirmed');
            return connection;
        } catch (e) {
            console.error(`Failed to connect to RPC: ${rpcUrl}, trying next...`, e.message);
        }
    }
    throw new Error("All Solana RPC endpoints are currently unreachable.");
}

/**
 * Fetches the real on-chain token balance of $GoldenGoal for a given wallet address.
 * Supports both Token-2022 standard and legacy SPL token accounts.
 * 
 * @param {string} walletAddress - The Solana public key of the wallet owner.
 * @returns {Promise<number>} - The token balance.
 */
export async function getTokenBalance(walletAddress) {
    if (!walletAddress) return 0;
    
    // Bypassing the network call entirely if GOLDEN_GOAL_MINT is not defined
    if (!GOLDEN_GOAL_MINT) {
        return 0;
    }

    let balance = 0;

    try {
        const connection = await getSolanaConnection();
        const userPubKey = new PublicKey(walletAddress);
        const mintPubKey = new PublicKey(GOLDEN_GOAL_MINT);
        
        // 1. Try Token-2022 (New standard used by Pump.fun and modern tokens)
        try {
            const ata = await getAssociatedTokenAddress(mintPubKey, userPubKey, false, TOKEN_2022_PROGRAM_ID);
            const balanceRes = await connection.getTokenAccountBalance(ata);
            if (balanceRes && balanceRes.value) {
                balance = balanceRes.value.uiAmount || 0;
                return balance;
            }
        } catch (e2022) {
            // If not found or failed, fall back to Legacy SPL Token
            if (!e2022.message?.includes("could not find account")) {
                // Log non-existence errors only if they are not standard "account not found"
                console.warn("Token-2022 check skipped/failed, trying legacy:", e2022.message);
            }
        }

        // 2. Try Legacy SPL Token Program
        try {
            const ata = await getAssociatedTokenAddress(mintPubKey, userPubKey, false, TOKEN_PROGRAM_ID);
            const balanceRes = await connection.getTokenAccountBalance(ata);
            if (balanceRes && balanceRes.value) {
                balance = balanceRes.value.uiAmount || 0;
            }
        } catch (eLegacy) {
            if (!eLegacy.message?.includes("could not find account")) {
                console.error("Legacy SPL token check failed:", eLegacy.message);
            }
        }
    } catch (e) {
        console.error("getTokenBalance connection/RPC error:", e.message);
    }



    return balance;
}
