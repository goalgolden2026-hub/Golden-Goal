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

        const tweetIdMatch = tweetUrl.match(/status\/([0-9]+)/);
        const tweetId = tweetIdMatch ? tweetIdMatch[1] : null;

        if (!tweetId) {
            return NextResponse.json({ success: false, error: "Could not parse Tweet ID from the URL." }, { status: 400 });
        }

        // Programmatic Tweet details verification via RapidAPI
        const rapidApiKey = process.env.RAPIDAPI_KEY;
        const rapidApiHost = process.env.RAPIDAPI_HOST;

        if (!rapidApiKey || !rapidApiHost) {
            console.error("RAPIDAPI_KEY or RAPIDAPI_HOST is missing in environment variables.");
            return NextResponse.json({ success: false, error: "Verification service configuration error." }, { status: 500 });
        }

        try {
            const apiRes = await fetch(`https://twitter-api45.p.rapidapi.com/tweet.php?id=${tweetId}`, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': rapidApiKey,
                    'X-RapidAPI-Host': rapidApiHost
                },
                next: { revalidate: 0 } // Ensure fresh data
            });

            if (apiRes.status === 200) {
                const tweetData = await apiRes.json();
                
                if (!tweetData || !tweetData.text) {
                    return NextResponse.json({ success: false, error: "Tweet details could not be retrieved from X. Please verify the link is public." }, { status: 400 });
                }

                const tweetText = tweetData.text.toLowerCase();
                
                // Programmatic verification: Check if it contains '#goldengoal' or '$goldengoal'
                const hasRequiredTags = tweetText.includes('#goldengoal') || tweetText.includes('$goldengoal');
                
                if (!hasRequiredTags) {
                    return NextResponse.json({ 
                        success: false, 
                        error: "Tweet does not contain the required #GoldenGoal or $GoldenGoal tags. Please correct and try again!" 
                    }, { status: 400 });
                }
            } else if (apiRes.status === 429) {
                return NextResponse.json({ success: false, error: "Verification service busy (Rate Limit). Please try again in a few moments." }, { status: 429 });
            } else {
                console.error(`RapidAPI returned error status: ${apiRes.status}`);
                return NextResponse.json({ success: false, error: "X API verification failed. Please try again later." }, { status: 400 });
            }
        } catch (apiErr) {
            console.error("RapidAPI fetch error:", apiErr);
            return NextResponse.json({ success: false, error: "Failed to connect to X verification service." }, { status: 500 });
        }

        const sql = await getDb();

        // 1. Check if the URL has already been submitted by ANYONE (Spam Protection)
        const urlCheckRes = await sql`SELECT id FROM social_tasks WHERE url = ${tweetUrl}`;
        if (urlCheckRes.rowCount > 0) {
            return NextResponse.json({ success: false, error: "This Tweet URL has already been submitted." }, { status: 400 });
        }

        // 2. Check 60-second cooldown for this user
        const cooldownRes = await sql`
            SELECT "createdAt" 
            FROM social_tasks 
            WHERE "walletAddress" = ${walletAddress} AND "taskType" = 'TWITTER_SHARE'
            ORDER BY "createdAt" DESC 
            LIMIT 1
        `;

        if (cooldownRes.rowCount > 0) {
            const lastTaskTime = new Date(cooldownRes.rows[0].createdAt).getTime();
            const now = new Date().getTime();
            const diffInSeconds = (now - lastTaskTime) / 1000;
            
            if (diffInSeconds < 60) {
                return NextResponse.json({ success: false, error: `Please wait ${Math.ceil(60 - diffInSeconds)} seconds before submitting another tweet.` }, { status: 400 });
            }
        }

        // 3. Update User Status and add 25 Social Points as reward
        await sql`
            UPDATE users 
            SET "socialPoints" = COALESCE("socialPoints", 0) + 25
            WHERE "walletAddress" = ${walletAddress}
        `;

        // 4. Log the submission
        await sql`
            INSERT INTO social_tasks ("walletAddress", "taskType", "url")
            VALUES (${walletAddress}, 'TWITTER_SHARE', ${tweetUrl})
        `;

        return NextResponse.json({ success: true, message: "Task completed! 25 Social Points awarded." }, { status: 200 });
    } catch (error) {
        console.error("POST /api/user/twitter error:", error);
        return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
    }
}
