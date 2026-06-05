import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getTokenBalance, getSolanaConnection } from '@/lib/solana';

const GOLDEN_GOAL_MINT = process.env.GOLDEN_GOAL_MINT || process.env.NEXT_PUBLIC_GOLDEN_GOAL_MINT;
const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

function verifySignature(walletAddress, message, signatureHex) {
    try {
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = new Uint8Array(
            signatureHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
        );
        const publicKeyBytes = bs58.decode(walletAddress);
        return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    } catch (err) {
        console.error("verifySignature error:", err);
        return false;
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { walletAddress, tier, amount, txSignature } = body;

        // 1. Perform On-Chain Transaction Verification
        if (!txSignature) {
            return NextResponse.json({ success: false, error: "Transaction signature required." }, { status: 400 });
        }

        if (!walletAddress || !tier || !amount) {
            return NextResponse.json({ success: false, error: "Missing required fields (walletAddress, tier, amount)" }, { status: 400 });
        }

        if (!GOLDEN_GOAL_MINT) {
            return NextResponse.json({ success: false, error: "Platform token configuration missing (GOLDEN_GOAL_MINT)." }, { status: 500 });
        }

        // Verify transaction on-chain
        const connection = await getSolanaConnection();
        let tx = null;
        for (let i = 0; i < 5; i++) {
            try {
                tx = await connection.getParsedTransaction(txSignature, {
                    maxSupportedTransactionVersion: 0
                });
                if (tx) break;
            } catch (txErr) {
                console.warn("Attempt to fetch transaction failed:", txErr.message);
            }
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        if (!tx) {
            return NextResponse.json({ success: false, error: "Transaction not found on-chain. Please ensure it is confirmed." }, { status: 400 });
        }

        // Verify transaction details:
        // We check instructions for a transfer of the correct amount of GOLDEN_GOAL_MINT to Stake Wallet
        let verified = false;
        const instructions = tx.transaction.message.instructions;
        const allInstructions = [...instructions];
        
        if (tx.meta && tx.meta.innerInstructions) {
            for (const inner of tx.meta.innerInstructions) {
                allInstructions.push(...inner.instructions);
            }
        }

        const mintPubKey = new PublicKey(GOLDEN_GOAL_MINT);
        
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
                console.error("Failed to parse PAYOUT_DISTRIBUTOR_KEY in lock verification:", e.message);
            }
        }
        const stakeWalletPubKey = new PublicKey(stakeWallet);
        
        // Derive expected destination Associated Token Accounts
        const expectedDestATA2022 = await getAssociatedTokenAddress(mintPubKey, stakeWalletPubKey, false, TOKEN_2022_PROGRAM_ID);
        const expectedDestATALegacy = await getAssociatedTokenAddress(mintPubKey, stakeWalletPubKey, false, TOKEN_PROGRAM_ID);

        for (const inst of allInstructions) {
            const isToken2022 = inst.programId.toString() === TOKEN_2022_PROGRAM_ID.toString();
            const isLegacy = inst.programId.toString() === TOKEN_PROGRAM_ID.toString();

            if (isToken2022 || isLegacy) {
                const parsed = inst.parsed;
                if (parsed && (parsed.type === 'transfer' || parsed.type === 'transferChecked')) {
                    const info = parsed.info;
                    const transferAmount = info.amount || info.tokenAmount?.amount;
                    const destination = info.destination;
                    
                    const expectedRawAmount = (amount * 1000000).toString(); // decimals = 6
                    const isCorrectDest = destination === expectedDestATA2022.toBase58() || destination === expectedDestATALegacy.toBase58();

                    if (isCorrectDest && BigInt(transferAmount) >= BigInt(expectedRawAmount)) {
                        // Check if the transaction was signed by the wallet owner
                        if (tx.transaction.message.accountKeys.some(k => k.pubkey.toBase58() === walletAddress && k.signer)) {
                            verified = true;
                            break;
                        }
                    }
                }
            }
        }

        if (!verified) {
            return NextResponse.json({ success: false, error: "On-chain transaction verification failed. Incorrect transfer amount, destination, or signature." }, { status: 400 });
        }

        if (!walletAddress || !tier || !amount) {
            return NextResponse.json({ success: false, error: "Missing required fields (walletAddress, tier, amount)" }, { status: 400 });
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

        // Validate tier min amounts
        let minAmountRequired = 0;
        if (tier === 1) minAmountRequired = 350000;
        else if (tier === 2) minAmountRequired = 500000;
        else if (tier === 3) minAmountRequired = 750000;
        else if (tier === 4) minAmountRequired = 1000000;

        if (amount < minAmountRequired) {
            return NextResponse.json({ success: false, error: `Invalid lock amount. Minimum required for Tier ${tier} is ${minAmountRequired.toLocaleString('en-US')} $GoldenGoal.` }, { status: 400 });
        }

        // 2. Double-check user's mock balance from the database profile
        const baseBalance = await getTokenBalance(walletAddress);
        let mockBalance = baseBalance;

        // Deduct active locks
        const activeLocksTotalRes = await sql`SELECT SUM(amount) as total FROM locks WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE'`;
        if (activeLocksTotalRes.rows[0].total) {
            mockBalance -= parseInt(activeLocksTotalRes.rows[0].total);
        }

        // Apply treasury logs
        const logsRes = await sql`SELECT amount, type FROM treasury_logs WHERE "walletAddress" = ${walletAddress}`;
        for (const log of logsRes.rows) {
            const amt = parseFloat(log.amount);
            if (log.type.includes('BURN') || log.type.includes('REWARD_POOL') || log.type === 'TREASURY') {
                mockBalance -= amt; // Deductions logged as positive
            } else if (log.type === 'SPIN_PAYMENT') {
                mockBalance += amt; // Already negative
            } else if (log.type === 'REFERRAL_REWARD' || log.type === 'SPIN_REWARD_GOLDEN') {
                mockBalance += amt; // Additions
            }
        }

        if (mockBalance < amount) {
            return NextResponse.json({ success: false, error: `Insufficient simulated balance. You need at least ${amount.toLocaleString('en-US')} $GoldenGoal to lock. You currently have ${mockBalance.toLocaleString('en-US')} $GoldenGoal.` }, { status: 400 });
        }

        // Check for existing active lock (one active lock per user)
        const activeLockRes = await sql`SELECT * FROM locks WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE'`;
        if (activeLockRes.rowCount > 0) {
            return NextResponse.json({ success: false, error: "You already have an active lock. Unlock first." }, { status: 400 });
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

        // Record the lock (store the on-chain txSignature to prevent replay attacks)
        await sql`
            INSERT INTO locks ("walletAddress", tier, amount, "unlockDate", status, "txSignature")
            VALUES (${walletAddress}, ${tier}, ${amount}, ${unlockDate}, 'ACTIVE', ${txSignature})
        `;

        return NextResponse.json({ success: true, message: "Simulated lock successful", unlockDate }, { status: 201 });
    } catch (error) {
        console.error("POST /api/lock error:", error);
        return NextResponse.json({ success: false, error: "Failed to lock tokens" }, { status: 500 });
    }
}
