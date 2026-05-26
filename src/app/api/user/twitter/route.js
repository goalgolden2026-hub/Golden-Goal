import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const { walletAddress, tweetUrl } = body;

        if (!walletAddress || !tweetUrl) {
            return NextResponse.json({ success: false, error: "Missing walletAddress or tweetUrl" }, { status: 400 });
        }

        // Basic Regex to check if it's a valid x.com or twitter.com status URL
        const twitterRegex = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/[0-9]+(\?.*)?$/;
        
        if (!twitterRegex.test(tweetUrl)) {
            return NextResponse.json({ success: false, error: "Invalid Tweet URL. Please enter a valid x.com or twitter.com link." }, { status: 400 });
        }

        const sql = await getDb();

        // Check if already completed
        const userRes = await sql`SELECT "twitterTaskStatus" FROM users WHERE "walletAddress" = ${walletAddress}`;
        if (userRes.rowCount === 0) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        if (userRes.rows[0].twitterTaskStatus) {
            return NextResponse.json({ success: false, error: "You have already completed this task." }, { status: 400 });
        }

        // Update User Status and add 25 Referral Points as reward
        await sql`
            UPDATE users 
            SET "twitterTaskStatus" = true,
                "referralPoints" = COALESCE("referralPoints", 0) + 25
            WHERE "walletAddress" = ${walletAddress}
        `;

        // Log the submission
        await sql`
            INSERT INTO social_tasks ("walletAddress", "taskType", "url")
            VALUES (${walletAddress}, 'TWITTER_SHARE', ${tweetUrl})
        `;

        return NextResponse.json({ success: true, message: "Task completed! 25 Points awarded." }, { status: 200 });
    } catch (error) {
        console.error("POST /api/user/twitter error:", error);
        return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
    }
}
