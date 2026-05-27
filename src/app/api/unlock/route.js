import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, createTransferInstruction, createBurnInstruction } from '@solana/spl-token';

const TOKEN_MINT = "HxWrnZznqF5iYf3ckMw3FTaZQvubB53ohzpjPSNUpump";

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

const REWARDS_TREASURY_WALLET = "FoUActw9raWWU6UshX5TQ2AHSFHUXDMtMGudiHmf2zmV";

// Redundant mainnet connections
const SOLANA_RPCS = [
    "https://api.mainnet-beta.solana.com",
    "https://solana-api.projectserum.com",
    "https://rpc.ankr.com/solana"
];

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

async function getSolanaConnection() {
    for (const rpcUrl of SOLANA_RPCS) {
        try {
            const connection = new Connection(rpcUrl, 'confirmed');
            // Quick test connection
            await connection.getLatestBlockhash();
            return connection;
        } catch (e) {
            console.error(`Failed to connect to RPC: ${rpcUrl}, trying next...`);
        }
    }
    throw new Error("All Solana RPC endpoints are currently unreachable.");
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { walletAddress, message, signature } = body;

        // 1. Perform Cryptographic Signature Verification
        if (!message || !signature) {
            return NextResponse.json({ success: false, error: "Cryptographic authentication required. Please sign the transaction." }, { status: 401 });
        }

        if (!message.includes("Authenticate Golden Goal Unlock Transaction") || !message.includes(walletAddress)) {
            return NextResponse.json({ success: false, error: "Invalid signature message payload." }, { status: 400 });
        }

        const isVerified = verifySignature(walletAddress, message, signature);
        if (!isVerified) {
            return NextResponse.json({ success: false, error: "Signature verification failed. Impersonation blocked." }, { status: 401 });
        }

        if (!walletAddress) {
            return NextResponse.json({ success: false, error: "Missing walletAddress" }, { status: 400 });
        }

        // 2. Fetch the active lock
        const sql = await getDb();
        const activeLockRes = await sql`SELECT * FROM locks WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE'`;
        if (activeLockRes.rowCount === 0) {
            return NextResponse.json({ success: false, error: "No active lock found." }, { status: 400 });
        }

        const lock = activeLockRes.rows[0];
        let penaltyAmount = 0;
        let isEarly = false;

        // 3. Check for early unlock penalty (10% penalty for Tiers 2, 3, 4 before unlock date)
        if (lock.tier > 1 && lock.unlockDate) {
            const now = new Date();
            const unlock = new Date(lock.unlockDate);
            if (now < unlock) {
                isEarly = true;
                penaltyAmount = lock.amount * 0.10;
                
                // Log the 50% Burn and 50% Treasury amounts in DB
                const burnAmount = penaltyAmount * 0.5;
                const treasuryAmount = penaltyAmount * 0.5;

                await sql`INSERT INTO treasury_logs ("walletAddress", amount, type) VALUES (${walletAddress}, ${burnAmount}, 'BURN')`;
                await sql`INSERT INTO treasury_logs ("walletAddress", amount, type) VALUES (${walletAddress}, ${treasuryAmount}, 'TREASURY')`;
            }
        }

        const returnedAmount = lock.amount - penaltyAmount;

        // 4. Automated On-Chain Token Transfer using PAYOUT_DISTRIBUTOR_KEY
        const secretKeyStr = process.env.PAYOUT_DISTRIBUTOR_KEY;
        if (!secretKeyStr) {
            return NextResponse.json({ 
                success: false, 
                error: "PAYOUT_DISTRIBUTOR_KEY is not defined on the server environment. Please configure it in .env.local to enable automated payouts." 
            }, { status: 500 });
        }

        let secretKey;
        try {
            if (secretKeyStr.trim().startsWith('[')) {
                secretKey = new Uint8Array(JSON.parse(secretKeyStr));
            } else {
                secretKey = bs58.decode(secretKeyStr.trim());
            }
        } catch (e) {
            return NextResponse.json({ success: false, error: "Failed to parse server's PAYOUT_DISTRIBUTOR_KEY secret key format." }, { status: 500 });
        }

        const distributorKeypair = Keypair.fromSecretKey(secretKey);
        const connection = await getSolanaConnection();
        const mintPubKey = new PublicKey(TOKEN_MINT);
        const userPubKey = new PublicKey(walletAddress);

        // Fetch mint decimals and program owner dynamically
        let decimals = 6;
        let tokenProgramId = TOKEN_PROGRAM_ID;
        try {
            const mintInfo = await connection.getParsedAccountInfo(mintPubKey);
            if (mintInfo?.value?.owner) {
                const ownerStr = mintInfo.value.owner.toString();
                if (ownerStr === TOKEN_2022_PROGRAM_ID.toString()) {
                    tokenProgramId = TOKEN_2022_PROGRAM_ID;
                    console.log("Unlock payout: detected Token-2022 program.");
                }
            }
            if (mintInfo?.value?.data?.parsed?.info?.decimals !== undefined) {
                decimals = mintInfo.value.data.parsed.info.decimals;
            }
        } catch (e) {
            console.error("Failed to parse mint decimals/owner, defaulting to legacy standard", e);
        }

        const rawReturnedAmount = BigInt(Math.round(returnedAmount * Math.pow(10, decimals)));
        
        let rawBurnAmount = 0n;
        let rawTreasuryAmount = 0n;
        if (isEarly && penaltyAmount > 0) {
            rawBurnAmount = BigInt(Math.round((penaltyAmount * 0.5) * Math.pow(10, decimals)));
            rawTreasuryAmount = BigInt(Math.round((penaltyAmount * 0.5) * Math.pow(10, decimals)));
        }

        // Retrieve or initialize Associated Token Accounts on-chain
        let distributorAta, userAta, treasuryAta;
        try {
            distributorAta = await getOrCreateAssociatedTokenAccount(
                connection,
                distributorKeypair,
                mintPubKey,
                distributorKeypair.publicKey,
                false,
                'confirmed',
                undefined,
                tokenProgramId
            );

            userAta = await getOrCreateAssociatedTokenAccount(
                connection,
                distributorKeypair,
                mintPubKey,
                userPubKey,
                false,
                'confirmed',
                undefined,
                tokenProgramId
            );

            if (isEarly && penaltyAmount > 0) {
                const treasuryPubKey = new PublicKey(REWARDS_TREASURY_WALLET);
                treasuryAta = await getOrCreateAssociatedTokenAccount(
                    connection,
                    distributorKeypair,
                    mintPubKey,
                    treasuryPubKey,
                    false,
                    'confirmed',
                    undefined,
                    tokenProgramId
                );
            }
        } catch (ataErr) {
            console.error("Associated Token Account error:", ataErr);
            return NextResponse.json({ success: false, error: `Solana account initialization failed: ${ataErr.message}` }, { status: 500 });
        }

        // Verify distributor has enough balance
        const totalNeeded = rawReturnedAmount + rawBurnAmount + rawTreasuryAmount;
        if (distributorAta.amount < totalNeeded) {
            return NextResponse.json({ 
                success: false, 
                error: `Payout distributor wallet balance is insufficient. Server wallet: ${distributorKeypair.publicKey.toString()}` 
            }, { status: 500 });
        }

        // Build and submit the SPL token transfer transaction
        let txSig = "";
        try {
            const tx = new Transaction().add(
                createTransferInstruction(
                    distributorAta.address,
                    userAta.address,
                    distributorKeypair.publicKey,
                    rawReturnedAmount,
                    [],
                    tokenProgramId
                )
            );

            if (isEarly && penaltyAmount > 0) {
                // Add real on-chain Burn instruction
                tx.add(
                    createBurnInstruction(
                        distributorAta.address,
                        mintPubKey,
                        distributorKeypair.publicKey,
                        rawBurnAmount,
                        [],
                        tokenProgramId
                    )
                );

                // Add real on-chain Rewards Treasury transfer instruction
                tx.add(
                    createTransferInstruction(
                        distributorAta.address,
                        treasuryAta.address,
                        distributorKeypair.publicKey,
                        rawTreasuryAmount,
                        [],
                        tokenProgramId
                    )
                );
                
                console.log(`[PENALTY APPLIED] - On-chain Burn: ${Number(rawBurnAmount) / (10 ** decimals)} FWC, Treasury: ${Number(rawTreasuryAmount) / (10 ** decimals)} FWC`);
            }

            const { blockhash } = await connection.getLatestBlockhash('confirmed');
            tx.recentBlockhash = blockhash;
            tx.feePayer = distributorKeypair.publicKey;

            txSig = await connection.sendTransaction(tx, [distributorKeypair]);
            
            // Confirm the transaction
            const latestBlockhash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                signature: txSig,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
            }, 'confirmed');

        } catch (txErr) {
            console.error("Payout transaction error:", txErr);
            return NextResponse.json({ success: false, error: `Automated on-chain payout transaction failed: ${txErr.message}` }, { status: 500 });
        }

        // 5. Deactivate lock in database
        await sql`UPDATE locks SET status = 'INACTIVE' WHERE id = ${lock.id}`;

        return NextResponse.json({ 
            success: true, 
            message: "Unlock successful and tokens successfully refunded.", 
            penaltyApplied: penaltyAmount > 0,
            penaltyAmount,
            returnedAmount,
            txSignature: txSig
        }, { status: 200 });

    } catch (error) {
        console.error("POST /api/unlock error:", error);
        return NextResponse.json({ success: false, error: "Failed to unlock tokens" }, { status: 500 });
    }
}
