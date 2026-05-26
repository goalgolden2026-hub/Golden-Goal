import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('walletAddress');

        const sql = await getDb();
        
        // Fetch Total Value Locked (TVL)
        const tvlRes = await sql`SELECT SUM(amount) as total FROM stakes WHERE status = 'ACTIVE'`;
        const totalValueLocked = tvlRes.rows[0]?.total || 0;

        // Fetch Active Stakers (Unique wallets)
        const stakersRes = await sql`SELECT COUNT(DISTINCT "walletAddress") as count FROM stakes WHERE status = 'ACTIVE'`;
        const activeStakers = stakersRes.rows[0]?.count || 0;

        // Fetch User Staked (if wallet provided)
        let userStaked = 0;
        let activeStake = null;
        if (walletAddress) {
            const userStakeRes = await sql`SELECT amount, tier, "unlockDate" FROM stakes WHERE "walletAddress" = ${walletAddress} AND status = 'ACTIVE'`;
            if (userStakeRes.rowCount > 0) {
                userStaked = userStakeRes.rows[0].amount;
                activeStake = {
                    tier: userStakeRes.rows[0].tier,
                    unlockDate: userStakeRes.rows[0].unlockDate
                };
            }
        }

        return NextResponse.json({ 
            success: true, 
            totalValueLocked: Number(totalValueLocked),
            activeStakers: Number(activeStakers),
            userStaked: Number(userStaked),
            activeStake: activeStake
        }, { status: 200 });

    } catch (error) {
        console.error("GET /api/stake/stats error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
    }
}
