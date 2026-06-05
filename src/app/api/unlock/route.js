import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction, 
  createBurnInstruction, 
  createAssociatedTokenAccountInstruction, 
  TOKEN_2022_PROGRAM_ID, 
  TOKEN_PROGRAM_ID 
} from '@solana/spl-token';

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
        const { walletAddress, message, signature } = body;

        // 1. Perform Cryptographic Signature Verification
        if (!message || !signature) {
            return NextResponse.json({ success: false, error: "Cryptographic authentication required. Please sign the transaction." }, { status: 401 });
        }

        // Check if message format matches unlock request
        if (!message.includes("Authenticate Golden Goal Unlock Transaction") || !message.includes(walletAddress)) {
            return NextResponse.json({ success: false, error: "Invalid signature message payload." }, { status: 400 });
        }

        // Verify signature
        const isVerified = verifySignature(walletAddress, message, signature);
        if (!isVerified) {
            return NextResponse.json({ success: false, error: "Signature verification failed. Impersonation blocked." }, { status: 401 });
        }

        if (!walletAddress) {
            return NextResponse.json({ success: false, error: "Missing walletAddress" }, { status: 400 });
        }

        if (!GOLDEN_GOAL_MINT) {
            return NextResponse.json({ success: false, error: "Platform token configuration missing (GOLDEN_GOAL_MINT)." }, { status: 500 });
        }

        const sql = await getDb();
        
        // 2. Fetch active lock
        const activeLockRes = await sql`SELECT * FROM locks WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE'`;
        if (activeLockRes.rowCount === 0) {
            return NextResponse.json({ success: false, error: "No active lock found." }, { status: 400 });
        }

        const lock = activeLockRes.rows[0];
        let penaltyAmount = 0;
        let isEarly = false;

        // 3. Check early unlock penalty (10% penalty for Tiers 2, 3, 4 before unlock date)
        if (lock.tier > 1 && lock.unlockDate) {
            const now = new Date();
            const unlock = new Date(lock.unlockDate);
            if (now < unlock) {
                isEarly = true;
                penaltyAmount = lock.amount * 0.10;
            }
        }

        const returnedAmount = lock.amount - penaltyAmount;

        // 4. Automated On-Chain Token Transfer using PAYOUT_DISTRIBUTOR_KEY
        const secretKeyStr = process.env.PAYOUT_DISTRIBUTOR_KEY;
        if (!secretKeyStr) {
            return NextResponse.json({ 
                success: false, 
                error: "PAYOUT_DISTRIBUTOR_KEY is not defined on the server environment. Please configure it in Vercel to enable automated refunds." 
            }, { status: 500 });
        }

        let secretKey;
        try {
            if (secretKeyStr.trim().startsWith('[')) {
                secretKey = new Uint8Array(JSON.parse(secretKeyStr));
            } else {
                const decodeFn = typeof bs58.decode === 'function' ? bs58.decode : bs58.default.decode;
                secretKey = decodeFn(secretKeyStr.trim());
            }
        } catch (e) {
            return NextResponse.json({ success: false, error: "Failed to parse server's secret key format." }, { status: 500 });
        }

        const distributorKeypair = Keypair.fromSecretKey(secretKey);
        const connection = new Connection(SOLANA_RPC, 'confirmed');
        const mintPubKey = new PublicKey(GOLDEN_GOAL_MINT);
        const userPubKey = new PublicKey(walletAddress);
        const treasuryPubKey = new PublicKey("5imEZhSwMUfx6XpyQCBqsCWxJKfmmF5JCNoxMWvB23cH");

        // Derive Associated Token Accounts
        const distributorATA = await getAssociatedTokenAddress(mintPubKey, distributorKeypair.publicKey, false, TOKEN_2022_PROGRAM_ID);
        const userATA = await getAssociatedTokenAddress(mintPubKey, userPubKey, false, TOKEN_2022_PROGRAM_ID);

        // Verify distributor has enough balance
        let distributorBalance = 0;
        try {
            const balRes = await connection.getTokenAccountBalance(distributorATA);
            distributorBalance = balRes.value.uiAmount || 0;
        } catch (e) {
            console.error("Failed to query distributor balance:", e.message);
            return NextResponse.json({ success: false, error: "Failed to query server's Stake Wallet balance on-chain." }, { status: 500 });
        }

        if (distributorBalance < returnedAmount) {
            return NextResponse.json({ 
                success: false, 
                error: `Server's Stake Wallet balance (${distributorBalance}) is insufficient to process refund of ${returnedAmount} tokens.` 
            }, { status: 500 });
        }

        // Build refund transaction
        const transaction = new Transaction();

        // Check if user ATA exists, if not create it
        const userAccountInfo = await connection.getAccountInfo(userATA);
        if (!userAccountInfo) {
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    distributorKeypair.publicKey, // payer
                    userATA,
                    userPubKey,
                    mintPubKey,
                    TOKEN_2022_PROGRAM_ID
                )
            );
        }

        // 4.1. Transfer returned amount (90% if early, 100% if mature) to user
        const rawReturnedAmount = BigInt(Math.round(returnedAmount * 1000000));
        transaction.add(
            createTransferInstruction(
                distributorATA,
                userATA,
                distributorKeypair.publicKey,
                rawReturnedAmount,
                [],
                TOKEN_2022_PROGRAM_ID
            )
        );

        // 4.2. If early unlock, process 10% penalty splits:
        // - 5% (half of 10%) goes to Treasury Wallet (5imEZhSwMUfx6XpyQCBqsCWxJKfmmF5JCNoxMWvB23cH)
        // - 5% (half of 10%) is burned on-chain
        if (isEarly && penaltyAmount > 0) {
            const halfPenalty = penaltyAmount * 0.5;
            const rawHalfPenaltyAmount = BigInt(Math.round(halfPenalty * 1000000));

            // Derive Treasury ATA
            const treasuryATA = await getAssociatedTokenAddress(mintPubKey, treasuryPubKey, false, TOKEN_2022_PROGRAM_ID);
            
            // Add instruction to create treasury ATA if not exists
            const destAccountInfo = await connection.getAccountInfo(treasuryATA);
            if (!destAccountInfo) {
                transaction.add(
                    createAssociatedTokenAccountInstruction(
                        distributorKeypair.publicKey, // payer
                        treasuryATA,
                        treasuryPubKey,
                        mintPubKey,
                        TOKEN_2022_PROGRAM_ID
                    )
                );
            }

            // Transfer 5% to Treasury Wallet
            transaction.add(
                createTransferInstruction(
                    distributorATA,
                    treasuryATA,
                    distributorKeypair.publicKey,
                    rawHalfPenaltyAmount,
                    [],
                    TOKEN_2022_PROGRAM_ID
                )
            );

            // Burn 5% directly from distributor's token account
            transaction.add(
                createBurnInstruction(
                    distributorATA,
                    mintPubKey,
                    distributorKeypair.publicKey,
                    rawHalfPenaltyAmount,
                    [],
                    TOKEN_2022_PROGRAM_ID
                )
            );

            // Log penalty splits in DB
            await sql`INSERT INTO treasury_logs ("walletAddress", amount, type) VALUES (${walletAddress}, ${halfPenalty}, 'BURN')`;
            await sql`INSERT INTO treasury_logs ("walletAddress", amount, type) VALUES (${walletAddress}, ${halfPenalty}, 'TREASURY')`;
        }

        // Send transaction
        let txSig = "";
        try {
            const { blockhash } = await connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = distributorKeypair.publicKey;

            txSig = await connection.sendTransaction(transaction, [distributorKeypair]);
            
            // Confirm transaction
            const latestBlockhash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                signature: txSig,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
            }, 'confirmed');
        } catch (txErr) {
            console.error("Refund transaction error:", txErr);
            return NextResponse.json({ success: false, error: `Automated on-chain refund transaction failed: ${txErr.message}` }, { status: 500 });
        }

        // 5. Deactivate lock in database
        await sql`UPDATE locks SET status = 'INACTIVE' WHERE id = ${lock.id}`;

        return NextResponse.json({ 
            success: true, 
            message: "Unlock successful and tokens successfully refunded.", 
            penaltyApplied: isEarly,
            penaltyAmount,
            returnedAmount,
            txSignature: txSig
        }, { status: 200 });

    } catch (error) {
        console.error("POST /api/unlock error:", error);
        return NextResponse.json({ success: false, error: "Failed to unlock tokens" }, { status: 500 });
    }
}
