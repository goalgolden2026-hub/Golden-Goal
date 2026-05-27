import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

const SOLANA_RPCS = [
    "https://api.mainnet-beta.solana.com",
    "https://solana-api.projectserum.com",
    "https://rpc.ankr.com/solana"
];

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('walletAddress');
        const tokenMint = searchParams.get('tokenMint') || "HxWrnZznqF5iYf3ckMw3FTaZQvubB53ohzpjPSNUpump";

        if (!walletAddress) {
            return NextResponse.json({ success: false, error: "Missing walletAddress parameter" }, { status: 400 });
        }

        console.log(`\n🔍 [API BALANCE CHECK] - Querying balance for wallet: ${walletAddress}`);
        console.log(`🔍 [API BALANCE CHECK] - Token Mint: ${tokenMint}\n`);

        const mintPubKey = new PublicKey(tokenMint);
        const userPubKey = new PublicKey(walletAddress);

        let balance = 0;
        let decimals = 6;
        let success = false;
        let lastError = null;
        let isToken2022 = false;
        let tokenProgramId = TOKEN_PROGRAM_ID;

        // 1. Query the token mint on-chain to detect the owner program (Token vs Token-2022)
        for (const rpcUrl of SOLANA_RPCS) {
            try {
                const connection = new Connection(rpcUrl, 'confirmed');
                const mintInfo = await connection.getParsedAccountInfo(mintPubKey);
                
                if (mintInfo?.value?.owner) {
                    const ownerStr = mintInfo.value.owner.toString();
                    if (ownerStr === TOKEN_2022_PROGRAM_ID.toString()) {
                        tokenProgramId = TOKEN_2022_PROGRAM_ID;
                        isToken2022 = true;
                        console.log(`🔍 [API MINT DETECT] - Detected modern Token-2022 standard.`);
                    } else {
                        console.log(`🔍 [API MINT DETECT] - Detected legacy SPL Token standard.`);
                    }

                    // Extract decimals if available from parsed info
                    if (mintInfo.value.data?.parsed?.info?.decimals !== undefined) {
                        decimals = mintInfo.value.data.parsed.info.decimals;
                    }
                }
                break; // Stop at first successful RPC check
            } catch (e) {
                console.error(`Failed to fetch mint info on RPC ${rpcUrl}:`, e.message);
                lastError = e.message;
            }
        }

        // 2. Derive the correct ATA account address using the correct program ID
        const userAta = await getAssociatedTokenAddress(mintPubKey, userPubKey, false, tokenProgramId);
        console.log(`🔍 [ATA DERIVED] - Derived ATA: ${userAta.toString()}`);

        // 3. Query the balance using the correct derived ATA
        for (const rpcUrl of SOLANA_RPCS) {
            try {
                const connection = new Connection(rpcUrl, 'confirmed');
                
                try {
                    const balanceInfo = await connection.getTokenAccountBalance(userAta);
                    if (balanceInfo?.value) {
                        balance = balanceInfo.value.uiAmount || 0;
                    }
                    success = true;
                    break;
                } catch (balErr) {
                    // If the account does not exist on-chain yet, balance is 0
                    if (balErr.message.includes("could not find account") || balErr.message.includes("does not exist") || balErr.message.includes("Invalid param")) {
                        balance = 0;
                        success = true;
                        break;
                    }
                    throw balErr;
                }
            } catch (err) {
                console.error(`Balance fetch failed on server RPC ${rpcUrl}:`, err.message);
                lastError = err.message;
            }
        }

        if (!success) {
            return NextResponse.json({ success: false, error: `Solana RPC error: ${lastError || "Unreachable"}` }, { status: 500 });
        }

        console.log(`🔍 [API RESPONSE] - Balance: ${balance}, Decimals: ${decimals}, isToken2022: ${isToken2022}\n`);

        return NextResponse.json({ success: true, balance, decimals, isToken2022 }, { status: 200 });

    } catch (error) {
        console.error("GET /api/user/token-balance error:", error);
        return NextResponse.json({ success: false, error: "Internal server error querying balance" }, { status: 500 });
    }
}
