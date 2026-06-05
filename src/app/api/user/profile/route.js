import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';
import { isWalletWhitelisted } from '@/lib/whitelist';
import { getTokenBalance } from '@/lib/solana';

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
                INSERT INTO users ("walletAddress", points, "predictionsToday", "lastPredictionDate", "referralCode", "referralPoints") 
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

        // Dynamic Balance Calculation
        const baseBalance = await getTokenBalance(walletAddress);
        let mockBalance = baseBalance;

        // Add active locks (since they are real on-chain transfers and have left the user's wallet)
        const activeLocksTotalRes = await sql`SELECT SUM(amount) as total FROM locks WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE'`;
        if (activeLocksTotalRes.rows[0].total) {
            mockBalance += parseInt(activeLocksTotalRes.rows[0].total);
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

        // Calculate Daily Predictions Limit
        const activeLockRes = await sql`SELECT tier FROM locks WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE'`;
        let bonusPredictions = 0;
        if (activeLockRes.rowCount > 0) {
            const lockTier = activeLockRes.rows[0].tier;
            if (lockTier === 1) bonusPredictions = 1;
            else if (lockTier === 2) bonusPredictions = 3;
            else if (lockTier === 3) bonusPredictions = 5;
            else if (lockTier === 4) bonusPredictions = 10;
        }

        const baseLimit = mockBalance >= 250000 ? 3 : 0;
        // Check if predictionsToday needs to be reset visually (if lastPredictionDate is not today)
        const today = new Date().toISOString().split('T')[0];
        let displayPredictionsToday = user.predictionsToday || 0;
        let displaySpinBonus = user.bonusPredictions || 0;
        
        if (user.lastPredictionDate && new Date(user.lastPredictionDate).toISOString().split('T')[0] !== today) {
            displayPredictionsToday = 0;
            displaySpinBonus = 0; // they expired
        }

        let maxPredictions = baseLimit + bonusPredictions + displaySpinBonus;
        if (isWalletWhitelisted(walletAddress)) {
            maxPredictions = Math.max(maxPredictions, 20);
        }

        return NextResponse.json({ 
            success: true, 
            profile: {
                walletAddress: user.walletAddress,
                balance: mockBalance,
                referralCode: user.referralCode,
                referralPoints: user.referralPoints,
                socialPoints: user.socialPoints || 0,
                twitterTaskStatus: user.twitterTaskStatus || false,
                totalInvited,
                predictionsToday: displayPredictionsToday,
                maxPredictions: maxPredictions
            }
        }, { status: 200 });

    } catch (error) {
        console.error("GET /api/user/profile error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
    }
}

