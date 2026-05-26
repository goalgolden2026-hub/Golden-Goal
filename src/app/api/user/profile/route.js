import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

function generateReferralCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 character code
}

// Get user profile data, balance, and referral stats
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('walletAddress');

        if (!walletAddress) {
            return NextResponse.json({ success: false, error: "Missing walletAddress" }, { status: 400 });
        }

        const sql = await getDb();
        
        // Ensure user exists
        let userRes = await sql`SELECT * FROM users WHERE "walletAddress" = ${walletAddress}`;
        
        if (userRes.rowCount === 0) {
            // User doesn't exist, create them
            const newCode = generateReferralCode();
            await sql`
                INSERT INTO users ("walletAddress", points, "betsToday", "lastBetDate", "referralCode", "referralPoints") 
                VALUES (${walletAddress}, 0, 0, CURRENT_DATE, ${newCode}, 0)
            `;
            userRes = await sql`SELECT * FROM users WHERE "walletAddress" = ${walletAddress}`;
        } else {
            // User exists, but check if they have a referral code (existing users might not)
            let user = userRes.rows[0];
            if (!user.referralCode) {
                const newCode = generateReferralCode();
                await sql`
                    UPDATE users SET "referralCode" = ${newCode} WHERE "walletAddress" = ${walletAddress}
                `;
                user.referralCode = newCode;
            }
        }

        const user = userRes.rows[0] || (await sql`SELECT * FROM users WHERE "walletAddress" = ${walletAddress}`).rows[0];

        // Fetch referral stats
        const referralStats = await sql`
            SELECT COUNT(*) as "totalInvited" 
            FROM referrals 
            WHERE "referrerCode" = ${user.referralCode} AND status = 'COMPLETED'
        `;
        const totalInvited = parseInt(referralStats.rows[0].totalInvited) || 0;

        // Balance mock (Phase 6 will be on-chain)
        const mockBalance = 30000;

        return NextResponse.json({ 
            success: true, 
            profile: {
                walletAddress: user.walletAddress,
                balance: mockBalance,
                referralCode: user.referralCode,
                referralPoints: user.referralPoints,
                totalInvited
            }
        }, { status: 200 });

    } catch (error) {
        console.error("GET /api/user/profile error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
    }
}
