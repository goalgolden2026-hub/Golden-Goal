import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function extractUsername(url) {
    const match = url.match(/https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status/);
    return match ? match[1].toLowerCase() : null;
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { walletAddress, twitterHandle, twitterHandle2 } = body;

        if (!walletAddress || !twitterHandle) {
            return NextResponse.json({ success: false, error: "Missing walletAddress or twitterHandle" }, { status: 400 });
        }

        // Clean handle 1: remove leading @, spaces, and make lowercase
        let cleanedHandle = twitterHandle.trim().toLowerCase();
        if (cleanedHandle.startsWith('@')) {
            cleanedHandle = cleanedHandle.substring(1);
        }

        // Validate handle 1 format
        const handleRegex = /^[a-zA-Z0-9_]{1,15}$/;
        if (!handleRegex.test(cleanedHandle)) {
            return NextResponse.json({ success: false, error: "Invalid X handle format for Account 1. Username must be 1-15 characters, containing only letters, numbers, and underscores." }, { status: 400 });
        }

        // Clean and validate handle 2 if provided
        let cleanedHandle2 = null;
        if (twitterHandle2 && twitterHandle2.trim()) {
            cleanedHandle2 = twitterHandle2.trim().toLowerCase();
            if (cleanedHandle2.startsWith('@')) {
                cleanedHandle2 = cleanedHandle2.substring(1);
            }

            if (!handleRegex.test(cleanedHandle2)) {
                return NextResponse.json({ success: false, error: "Invalid X handle format for Account 2. Username must be 1-15 characters, containing only letters, numbers, and underscores." }, { status: 400 });
            }

            if (cleanedHandle === cleanedHandle2) {
                return NextResponse.json({ success: false, error: "Account 1 and Account 2 must be different X handles." }, { status: 400 });
            }
        }

        const sql = await getDb();

        // 1. Check if either twitterHandle is already linked to another wallet
        let handleCheck;
        if (cleanedHandle2) {
            handleCheck = await sql`
                SELECT "walletAddress" 
                FROM users 
                WHERE 
                    (LOWER("twitterHandle") = ${cleanedHandle} OR 
                     LOWER("twitterHandle2") = ${cleanedHandle} OR 
                     LOWER("twitterHandle") = ${cleanedHandle2} OR 
                     LOWER("twitterHandle2") = ${cleanedHandle2})
                    AND "walletAddress" != ${walletAddress}
            `;
        } else {
            handleCheck = await sql`
                SELECT "walletAddress" 
                FROM users 
                WHERE 
                    (LOWER("twitterHandle") = ${cleanedHandle} OR 
                     LOWER("twitterHandle2") = ${cleanedHandle})
                    AND "walletAddress" != ${walletAddress}
            `;
        }
        
        if (handleCheck.rowCount > 0) {
            return NextResponse.json({ success: false, error: "One of the X handles is already linked to another wallet address." }, { status: 400 });
        }

        // Fetch current user details
        const userRes = await sql`SELECT points, "socialPoints" FROM users WHERE "walletAddress" = ${walletAddress}`;
        if (userRes.rowCount === 0) {
            return NextResponse.json({ success: false, error: "User profile not found." }, { status: 404 });
        }
        
        const originalSocialPoints = parseInt(userRes.rows[0].socialPoints) || 0;

        // 2. Fetch past TWITTER_SHARE tasks for this user
        const pastTasks = await sql`
            SELECT id, url 
            FROM social_tasks 
            WHERE "walletAddress" = ${walletAddress} AND "taskType" = 'TWITTER_SHARE'
        `;

        const tasksToDelete = [];
        const iTasksToVerify = [];

        for (const task of pastTasks.rows) {
            const usernameInUrl = extractUsername(task.url);
            if (usernameInUrl) {
                if (usernameInUrl === 'i') {
                    iTasksToVerify.push(task);
                } else {
                    const isMatched = (usernameInUrl === cleanedHandle) || (cleanedHandle2 && usernameInUrl === cleanedHandle2);
                    if (!isMatched) {
                        tasksToDelete.push(task.id);
                    }
                }
            } else {
                // Invalid URL pattern, delete
                tasksToDelete.push(task.id);
            }
        }

        // Anti-Spam protection: if user has more than 10 /i/ links, immediately delete them all as spam.
        if (iTasksToVerify.length > 10) {
            console.log(`User ${walletAddress} has ${iTasksToVerify.length} /i/ links. Treating all as invalid spam.`);
            for (const task of iTasksToVerify) {
                tasksToDelete.push(task.id);
            }
        } else if (iTasksToVerify.length > 0) {
            // Verify up to 10 /i/ links via RapidAPI
            const rapidApiKey = process.env.TWITTER_RAPIDAPI_KEY || process.env.RAPIDAPI_KEY || 'fb0b6761c9msha29978207b28aa6p17856bjsnca9d44b79409';
            const rapidApiHost = process.env.RAPIDAPI_HOST || 'twitter-api45.p.rapidapi.com';

            for (const task of iTasksToVerify) {
                const tweetIdMatch = task.url.match(/status\/([0-9]+)/);
                const tweetId = tweetIdMatch ? tweetIdMatch[1] : null;

                if (!tweetId) {
                    tasksToDelete.push(task.id);
                    continue;
                }

                try {
                    const apiRes = await fetch(`https://twitter-api45.p.rapidapi.com/tweet.php?id=${tweetId}`, {
                        method: 'GET',
                        headers: {
                            'X-RapidAPI-Key': rapidApiKey,
                            'X-RapidAPI-Host': rapidApiHost
                        }
                    });

                    if (apiRes.status === 200) {
                        const tweetData = await apiRes.json();
                        const tweetAuthor = tweetData?.author?.screen_name?.toLowerCase();
                        const isMatched = (tweetAuthor === cleanedHandle) || (cleanedHandle2 && tweetAuthor === cleanedHandle2);

                        if (!tweetAuthor || !isMatched) {
                            tasksToDelete.push(task.id);
                        }
                    } else {
                        // If API fails or rate limits, to be safe we invalidate suspicious /i/ links.
                        tasksToDelete.push(task.id);
                    }
                    
                    // Simple rate limit padding
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (err) {
                    console.error(`Error verifying /i/ link ${task.url}:`, err);
                    tasksToDelete.push(task.id);
                }
            }
        }

        // 3. Mark invalid tasks as REJECTED instead of deleting them
        if (tasksToDelete.length > 0) {
            await sql`
                UPDATE social_tasks 
                SET status = 'REJECTED'
                WHERE id = ANY(${tasksToDelete})
            `;
        }

        // 4. Calculate deduction for rejected tasks
        const remainingTasksRes = await sql`
            SELECT COUNT(*) as count 
            FROM social_tasks 
            WHERE "walletAddress" = ${walletAddress} AND "taskType" = 'TWITTER_SHARE' AND status = 'COMPLETED'
        `;
        const validCount = parseInt(remainingTasksRes.rows[0].count) || 0;
        const rejectedCount = tasksToDelete.length;
        const deduction = rejectedCount * 25;
        const newSocialPoints = Math.max(0, originalSocialPoints - deduction);

        // 5. Update user profile
        await sql`
            UPDATE users 
            SET 
                "twitterHandle" = ${cleanedHandle},
                "twitterHandle2" = ${cleanedHandle2},
                "socialPoints" = GREATEST(0, "socialPoints" - ${deduction}),
                points = GREATEST(0, points - ${deduction}),
                "twitterTaskStatus" = ${validCount > 0}
            WHERE "walletAddress" = ${walletAddress}
        `;

        return NextResponse.json({ 
            success: true, 
            message: "X accounts linked and historical tasks verified successfully.", 
            twitterHandle: cleanedHandle,
            twitterHandle2: cleanedHandle2,
            newSocialPoints,
            removedCount: tasksToDelete.length,
            validCount
        }, { status: 200 });

    } catch (error) {
        console.error("POST /api/user/twitter/link error:", error);
        return NextResponse.json({ success: false, error: "Server error during account linking" }, { status: 500 });
    }
}
