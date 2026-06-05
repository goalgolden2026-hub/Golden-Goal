import { NextResponse } from 'next/server';

const SOLANA_RPCS = [
    "https://solana.publicnode.com",
    "https://api.mainnet-beta.solana.com"
];

export async function POST(request) {
    try {
        const body = await request.json();
        
        let lastError = null;
        for (const rpcUrl of SOLANA_RPCS) {
            try {
                const response = await fetch(rpcUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                    // Set a timeout to fail fast and move to next RPC if one is slow
                    signal: AbortSignal.timeout(5000)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return NextResponse.json(data, { status: 200 });
                }
                
                const errText = await response.text();
                lastError = `Status ${response.status}: ${errText}`;
            } catch (err) {
                lastError = err.message;
            }
        }
        
        return NextResponse.json({
            jsonrpc: "2.0",
            error: {
                code: -32603,
                message: `All RPC endpoints failed. Last error: ${lastError}`
            },
            id: body.id || null
        }, { status: 502 });
        
    } catch (error) {
        console.error("RPC Proxy internal error:", error);
        return NextResponse.json({
            jsonrpc: "2.0",
            error: {
                code: -32603,
                message: `Internal proxy error: ${error.message}`
            },
            id: null
        }, { status: 500 });
    }
}
