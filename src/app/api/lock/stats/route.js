import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('walletAddress');

        const sql = await getDb();
        
        // Fetch Total Value Locked (TVL)
        const tvlRes = await sql`SELECT SUM(amount) as total FROM locks WHERE status = 'ACTIVE'`;
        const totalValueLocked = tvlRes.rows[0]?.total || 0;

        // Fetch Active Lockers (Unique wallets)
        const lockersRes = await sql`SELECT COUNT(DISTINCT "walletAddress") as count FROM locks WHERE status = 'ACTIVE'`;
        const activeLockers = lockersRes.rows[0]?.count || 0;

        // Fetch Active Lockers per Tier (Unique wallets)
        const tierCountsRes = await sql`
            SELECT tier, COUNT(DISTINCT "walletAddress") as count 
            FROM locks 
            WHERE status = 'ACTIVE' 
            GROUP BY tier
        `;
        const tierCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
        tierCountsRes.rows.forEach(row => {
            tierCounts[row.tier] = Number(row.count);
        });

        // Fetch User Locked (if wallet provided)
        let userLocked = 0;
        let activeLock = null;
        if (walletAddress) {
            const userLockRes = await sql`SELECT amount, tier, "unlockDate" FROM locks WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE'`;
            if (userLockRes.rowCount > 0) {
                userLocked = userLockRes.rows[0].amount;
                activeLock = {
                    tier: userLockRes.rows[0].tier,
                    unlockDate: userLockRes.rows[0].unlockDate
                };
            }
        }

        return NextResponse.json({ 
            success: true, 
            totalValueLocked: Number(totalValueLocked),
            activeLockers: Number(activeLockers),
            userLocked: Number(userLocked),
            activeLock: activeLock,
            tierCounts: tierCounts
        }, { status: 200 });

    } catch (error) {
        console.error("GET /api/lock/stats error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
    }
}
