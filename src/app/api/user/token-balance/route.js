import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

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
        const userAta = await getAssociatedTokenAddress(mintPubKey, userPubKey);

        let balance = 0;
        let decimals = 6;
        let success = false;
        let lastError = null;

        for (const rpcUrl of SOLANA_RPCS) {
            try {
                const connection = new Connection(rpcUrl, 'confirmed');
                
                // Fetch decimals dynamically
                try {
                    const mintInfo = await connection.getParsedAccountInfo(mintPubKey);
                    if (mintInfo?.value?.data?.parsed?.info?.decimals !== undefined) {
                        decimals = mintInfo.value.data.parsed.info.decimals;
                    }
                } catch (decErr) {
                    console.error("Failed to parse mint decimals on server", decErr);
                }

                try {
                    const balanceInfo = await connection.getTokenAccountBalance(userAta);
                    if (balanceInfo?.value) {
                        balance = balanceInfo.value.uiAmount || 0;
                    }
                    success = true;
                    break; // Success!
                } catch (balErr) {
                    // If the account does not exist on-chain yet, balance is indeed 0
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

        return NextResponse.json({ success: true, balance, decimals }, { status: 200 });

    } catch (error) {
        console.error("GET /api/user/token-balance error:", error);
        return NextResponse.json({ success: false, error: "Internal server error querying balance" }, { status: 500 });
    }
}
