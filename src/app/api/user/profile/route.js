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

        // Dynamic Balance Calculation
        let mockBalance = 30000;

        // Deduct active stakes
        const activeStakesTotalRes = await sql`SELECT SUM(amount) as total FROM stakes WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE'`;
        if (activeStakesTotalRes.rows[0].total) {
            mockBalance -= parseInt(activeStakesTotalRes.rows[0].total);
        }

        // Apply treasury logs
        const logsRes = await sql`SELECT amount, type FROM treasury_logs WHERE "walletAddress" = ${walletAddress}`;
        for (const log of logsRes.rows) {
            const amt = parseFloat(log.amount);
            if (log.type.includes('BURN') || log.type.includes('REWARD_POOL') || log.type === 'TREASURY') {
                mockBalance -= amt; // Deductions logged as positive
            } else if (log.type === 'SPIN_PAYMENT') {
                mockBalance += amt; // Already negative (-500)
            } else if (log.type === 'REFERRAL_REWARD' || log.type === 'SPIN_REWARD_GOLDEN') {
                mockBalance += amt; // Additions
            }
        }

        // Calculate Daily Bets Limit
        const activeStakeRes = await sql`SELECT tier FROM stakes WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE'`;
        let bonusBets = 0;
        if (activeStakeRes.rowCount > 0) {
            const stakeTier = activeStakeRes.rows[0].tier;
            if (stakeTier === 1) bonusBets = 1;
            else if (stakeTier === 2) bonusBets = 3;
            else if (stakeTier === 3) bonusBets = 5;
            else if (stakeTier === 4) bonusBets = 10;
        }

        const baseLimit = 5;
        // Check if betsToday needs to be reset visually (if lastBetDate is not today)
        const today = new Date().toISOString().split('T')[0];
        let displayBetsToday = user.betsToday || 0;
        let displaySpinBonus = user.spinBonusBets || 0;
        
        if (user.lastBetDate && new Date(user.lastBetDate).toISOString().split('T')[0] !== today) {
            displayBetsToday = 0;
            displaySpinBonus = 0; // they expired
        }

        const maxBets = baseLimit + bonusBets + displaySpinBonus;

        return NextResponse.json({ 
            success: true, 
            profile: {
                walletAddress: user.walletAddress,
                balance: mockBalance,
                referralCode: user.referralCode,
                referralPoints: user.referralPoints,
                totalInvited,
                betsToday: displayBetsToday,
                maxBets: maxBets
            }
        }, { status: 200 });

    } catch (error) {
        console.error("GET /api/user/profile error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
    }
}
