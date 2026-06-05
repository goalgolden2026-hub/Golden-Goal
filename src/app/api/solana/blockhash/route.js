import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';

const SOLANA_RPCS = [
    "https://solana.publicnode.com",
    "https://api.mainnet-beta.solana.com"
];

export async function GET() {
    let lastError = null;
    
    for (const rpcUrl of SOLANA_RPCS) {
        try {
            const connection = new Connection(rpcUrl, 'confirmed');
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
            return NextResponse.json({ success: true, blockhash, lastValidBlockHeight }, { status: 200 });
        } catch (e) {
            console.error(`Failed to fetch blockhash on server RPC ${rpcUrl}:`, e.message);
            lastError = e.message;
        }
    }
    
    return NextResponse.json({ success: false, error: `Failed to retrieve blockhash: ${lastError || "Unreachable"}` }, { status: 500 });
}
