import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { isWalletWhitelisted } from './whitelist';

const GOLDEN_GOAL_MINT = process.env.GOLDEN_GOAL_MINT || process.env.NEXT_PUBLIC_GOLDEN_GOAL_MINT;
const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

/**
 * Fetches the real on-chain token balance of $GoldenGoal for a given wallet address.
 * Connects to Solana Mainnet Beta. Falls back to a mock balance of 5,000,000 for
 * whitelisted developer/tester wallets if they hold 0 tokens.
 * 
 * @param {string} walletAddress - The Solana public key of the wallet owner.
 * @returns {Promise<number>} - The token balance.
 */
export async function getTokenBalance(walletAddress) {
    if (!walletAddress) return 0;
    
    const isWhitelisted = isWalletWhitelisted(walletAddress);

    // Bypassing the network call entirely and avoiding the PublicKey instantiation if token is not out.
    if (!GOLDEN_GOAL_MINT) {
        return isWhitelisted ? 5000000 : 0;
    }

    let balance = 0;
    let querySuccessful = false;

    try {
        const connection = new Connection(SOLANA_RPC, 'confirmed');
        const userPubKey = new PublicKey(walletAddress);
        const mintPubKey = new PublicKey(GOLDEN_GOAL_MINT);
        
        // Derive Associated Token Account (ATA) address
        const ata = await getAssociatedTokenAddress(mintPubKey, userPubKey);
        
        // Fetch balance from the network
        const balanceRes = await connection.getTokenAccountBalance(ata);
        if (balanceRes && balanceRes.value) {
            balance = balanceRes.value.uiAmount || 0;
            querySuccessful = true;
        }
    } catch (e) {
        // If the ATA doesn't exist, it means the balance is 0. This is a common and normal scenario.
        // We log other errors but safely proceed with 0 balance.
        if (!e.message?.includes("could not find account")) {
            console.error("getTokenBalance network/RPC error:", e.message);
        }
    }

    // Apply whitelist fallback for testing: if the user holds 0 tokens on mainnet
    // and is on the authorized preview list, grant them 5,000,000 mock tokens.
    if (balance === 0 && isWhitelisted) {
        return 5000000;
    }

    return balance;
}
