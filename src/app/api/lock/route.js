import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Connection } from '@solana/web3.js';

const VAULT_WALLET = "GwnoqZegE4QuxENTLUKPrmkM4zapUDHkjVc6hy2BMtMY";
const TOKEN_MINT = "HxWrnZznqF5iYf3ckMw3FTaZQvubB53ohzpjPSNUpump";

// Redundant public Mainnet RPC pool for high reliability
const SOLANA_RPCS = [
    "https://api.mainnet-beta.solana.com",
    "https://solana-api.projectserum.com",
    "https://rpc.ankr.com/solana"
];

async function verifySolanaTransaction(txSignature, walletAddress, expectedAmount) {
    let lastError = null;
    
    for (const rpcUrl of SOLANA_RPCS) {
        try {
            const connection = new Connection(rpcUrl, 'finalized');
            const tx = await connection.getParsedTransaction(txSignature, {
                maxSupportedTransactionVersion: 0
            });
            
            if (!tx) {
                throw new Error("Transaction not found or not finalized on Solana yet.");
            }
            
            if (tx.meta?.err) {
                throw new Error("Transaction failed on-chain.");
            }
            
            // 1. Verify user's wallet address actually signed this transaction
            const signers = tx.transaction.message.accountKeys.filter(k => k.signer);
            const isSigner = signers.some(s => s.pubkey.toString() === walletAddress);
            if (!isSigner) {
                throw new Error("The lock owner wallet address did not sign this transaction.");
            }
            
            // 2. Verify vault wallet received the correct amount of the correct token mint
            const vaultPost = tx.meta.postTokenBalances?.find(
                b => b.owner === VAULT_WALLET && b.mint === TOKEN_MINT
            );
            
            if (!vaultPost) {
                throw new Error("Vault wallet did not receive the target token mint in this transaction.");
            }
            
            const vaultPre = tx.meta.preTokenBalances?.find(
                b => b.accountIndex === vaultPost.accountIndex
            );
            
            const postAmount = BigInt(vaultPost.uiTokenAmount.amount);
            const preAmount = vaultPre ? BigInt(vaultPre.uiTokenAmount.amount) : 0n;
            const diffAmount = postAmount - preAmount;
            
            const decimals = vaultPost.uiTokenAmount.decimals || 6;
            const expectedRaw = BigInt(expectedAmount) * (10n ** BigInt(decimals));
            
            if (diffAmount < expectedRaw) {
                throw new Error(`Insufficient amount transferred to vault. Expected: ${expectedAmount}, Received: ${Number(diffAmount) / (10 ** decimals)}`);
            }
            
            return { success: true };
        } catch (err) {
            console.error(`Solana verification failure on RPC ${rpcUrl}:`, err.message);
            lastError = err.message;
        }
    }
    
    return { success: false, error: lastError || "Failed to verify transaction across all RPC endpoints." };
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { walletAddress, tier, amount, txSignature } = body;

        if (!walletAddress || !tier || !amount || !txSignature) {
            return NextResponse.json({ success: false, error: "Missing required fields (walletAddress, tier, amount, txSignature)" }, { status: 400 });
        }

        const sql = await getDb();
        
        // Ensure user exists
        let userRes = await sql`SELECT * FROM users WHERE "walletAddress" = ${walletAddress}`;
        if (userRes.rowCount === 0) {
            await sql`
                INSERT INTO users ("walletAddress", points, "predictionsToday", "lastPredictionDate") 
                VALUES (${walletAddress}, 0, 0, CURRENT_DATE)
            `;
        }

        // Check for existing active lock (one active lock per user)
        const activeLockRes = await sql`SELECT * FROM locks WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE'`;
        if (activeLockRes.rowCount > 0) {
            return NextResponse.json({ success: false, error: "You already have an active lock. Unlock first." }, { status: 400 });
        }

        // Double-spending / Replay protection check
        const replayRes = await sql`SELECT * FROM locks WHERE "txSignature" = ${txSignature}`;
        if (replayRes.rowCount > 0) {
            return NextResponse.json({ success: false, error: "This transaction signature has already been used for a lock." }, { status: 400 });
        }

        // Cryptographically verify Solana mainnet transfer
        const verification = await verifySolanaTransaction(txSignature, walletAddress, amount);
        if (!verification.success) {
            return NextResponse.json({ success: false, error: `On-chain verification failed: ${verification.error}` }, { status: 400 });
        }

        // Calculate unlock date
        let daysToLock = 0;
        if (tier === 1) daysToLock = 1; // 24-Hour lock for Soft Lock
        else if (tier === 2) daysToLock = 7;
        else if (tier === 3) daysToLock = 15;
        else if (tier === 4) daysToLock = 30;

        let unlockDate = null;
        if (daysToLock > 0) {
            const date = new Date();
            date.setDate(date.getDate() + daysToLock);
            unlockDate = date.toISOString();
        }

        // Record the lock with the validated txSignature
        await sql`
            INSERT INTO locks ("walletAddress", tier, amount, "unlockDate", "txSignature", status)
            VALUES (${walletAddress}, ${tier}, ${amount}, ${unlockDate}, ${txSignature}, 'ACTIVE')
        `;

        return NextResponse.json({ success: true, message: "On-chain lock successful", unlockDate }, { status: 201 });
    } catch (error) {
        console.error("POST /api/lock error:", error);
        return NextResponse.json({ success: false, error: "Failed to lock tokens" }, { status: 500 });
    }
}
