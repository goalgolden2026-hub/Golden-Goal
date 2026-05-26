import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

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
        const { walletAddress, tier, amount, message, signature } = body;

        // Perform Cryptographic Signature Verification
        if (!message || !signature) {
            return NextResponse.json({ success: false, error: "Cryptographic authentication required. Please sign the transaction." }, { status: 401 });
        }

        // Check if message format matches lock request
        if (!message.includes("Authenticate Golden Goal Lock Transaction") || !message.includes(walletAddress)) {
            return NextResponse.json({ success: false, error: "Invalid signature message payload." }, { status: 400 });
        }

        // Verify signature
        const isVerified = verifySignature(walletAddress, message, signature);
        if (!isVerified) {
            return NextResponse.json({ success: false, error: "Signature verification failed. Impersonation blocked." }, { status: 401 });
        }

        // Tier definitions
        // 1: Soft Lock (No lock), 2: 7-Day, 3: 15-Day, 4: 30-Day
        if (!walletAddress || !tier || !amount) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
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

        // Check for existing active lock (simple logic: one active lock per user)
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

        await sql`
            INSERT INTO locks ("walletAddress", tier, amount, "unlockDate", status)
            VALUES (${walletAddress}, ${tier}, ${amount}, ${unlockDate}, 'ACTIVE')
        `;

        return NextResponse.json({ success: true, message: "Lock successful", unlockDate }, { status: 201 });
    } catch (error) {
        console.error("POST /api/lock error:", error);
        return NextResponse.json({ success: false, error: "Failed to lock" }, { status: 500 });
    }
}
