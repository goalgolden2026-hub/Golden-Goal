import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const SPORTRADAR_API_KEY = process.env.SPORTRADAR_API_KEY || 'Et17n0p8lXDbQIPqyEqWjjaNjWHACZKBLBELV6J0';
const SPORTRADAR_BASE_URL = 'https://api.sportradar.com/soccer/trial/v4/en';

// Server-side persistent log helper
function writeLog(message) {
    try {
        const logFilePath = path.join(process.cwd(), 'sportradar_sync_logs.txt');
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`, 'utf8');
    } catch (e) {
        console.error("Local logger failed:", e);
    }
}

// Helper to normalize and match team names
function normalizeName(name) {
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));
        const { date } = body; // Format: YYYY-MM-DD
        
        if (!date) {
            writeLog(`[ERROR] Sync triggered but missing date parameter.`);
            return NextResponse.json({ success: false, error: 'Missing date parameter' }, { status: 400 });
        }

        writeLog(`[START] Sync automation triggered for target date: ${date}`);

        // 1. Fetch daily schedule from Sportradar
        const sportradarUrl = `${SPORTRADAR_BASE_URL}/schedules/${date}/schedules.json?api_key=${SPORTRADAR_API_KEY}`;
        const srResponse = await fetch(sportradarUrl);
        if (!srResponse.ok) {
            writeLog(`[ERROR] Sportradar API schedule request failed: ${srResponse.statusText}`);
            return NextResponse.json({ success: false, error: `Sportradar API error: ${srResponse.statusText}` }, { status: srResponse.status });
        }
        const srData = await srResponse.json();
        const srEvents = srData.schedules || [];
        writeLog(`[FETCH] Successfully fetched Sportradar schedule. Found ${srEvents.length} daily events.`);

        const sql = await getDb();

        // 2. Fetch all active/pending markets from our database
        const dbMarketsRes = await sql`
            SELECT id, "teamA", "teamB", status 
            FROM markets 
            WHERE status = 'ACTIVE' OR "scoreA" IS NULL OR "scoreB" IS NULL
        `;
        const dbMarkets = dbMarketsRes.rows;
        writeLog(`[DB] Found ${dbMarkets.length} active/unresolved markets in database.`);

        let processedMatches = 0;
        let resolvedCount = 0;

        // 3. Match and Sync database fixtures with Sportradar events
        for (const dbMarket of dbMarkets) {
            const dbA = normalizeName(dbMarket.teamA);
            const dbB = normalizeName(dbMarket.teamB);

            const matchedSrEvent = srEvents.find(event => {
                const competitors = event.sport_event?.competitors || [];
                const home = competitors.find(c => c.qualifier === 'home')?.name || '';
                const away = competitors.find(c => c.qualifier === 'away')?.name || '';
                
                const normHome = normalizeName(home);
                const normAway = normalizeName(away);

                const match1 = (normHome === dbA || normHome.includes(dbA) || dbA.includes(normHome)) && 
                               (normAway === dbB || normAway.includes(dbB) || dbB.includes(normAway));
                const match2 = (normHome === dbB || normHome.includes(dbB) || dbB.includes(normHome)) && 
                               (normAway === dbA || normAway.includes(dbA) || dbA.includes(normAway));
                return match1 || match2;
            });

            if (!matchedSrEvent) {
                continue;
            }

            const eventStatus = matchedSrEvent.sport_event_status || {};
            writeLog(`[MATCH] Found Sportradar match for DB Market ID ${dbMarket.id} (${dbMarket.teamA} vs ${dbMarket.teamB}). Sportradar status: ${eventStatus.status} | match_status: ${eventStatus.match_status}`);
            
            // Only process matches that are fully concluded
            if (eventStatus.status !== 'closed' || eventStatus.match_status !== 'ended') {
                writeLog(`[SKIP] Match ID ${dbMarket.id} is not fully ended yet. Skipping resolution.`);
                continue;
            }

            const homeScore = parseInt(eventStatus.home_score);
            const awayScore = parseInt(eventStatus.away_score);
            const teamA = dbMarket.teamA;
            const teamB = dbMarket.teamB;
            writeLog(`[SCORE] Match ID ${dbMarket.id} ended. Score: ${teamA} ${homeScore} - ${awayScore} ${teamB}`);

            // --- 4. Resolve the 6 Prediction Sub-Markets ---
            const outcomes = {};

            // 1. MAIN (Match Result)
            if (homeScore > awayScore) outcomes['MAIN'] = teamA;
            else if (awayScore > homeScore) outcomes['MAIN'] = teamB;
            else outcomes['MAIN'] = 'Draw';

            // 2. TOTAL_GOALS (Over/Under 2.5)
            outcomes['TOTAL_GOALS'] = (homeScore + awayScore >= 3) ? 'Over 2.5' : 'Under 2.5';

            // 3. BTTS (Both Teams to Score)
            outcomes['BTTS'] = (homeScore > 0 && awayScore > 0) ? 'Yes' : 'No';

            // 4. FIRST_HALF (First Half Winner)
            const firstHalfPeriod = eventStatus.period_scores?.find(p => p.number === 1 && p.type === 'regular_period');
            if (firstHalfPeriod) {
                const fhHome = parseInt(firstHalfPeriod.home_score);
                const fhAway = parseInt(firstHalfPeriod.away_score);
                if (fhHome > fhAway) outcomes['FIRST_HALF'] = teamA;
                else if (fhAway > fhHome) outcomes['FIRST_HALF'] = teamB;
                else outcomes['FIRST_HALF'] = 'Draw';
            } else {
                outcomes['FIRST_HALF'] = 'Draw';
            }

            // 5. DOUBLE_CHANCE (Double Chance)
            if (homeScore === awayScore) {
                outcomes['DOUBLE_CHANCE'] = 'DRAW';
            } else if (homeScore > awayScore) {
                outcomes['DOUBLE_CHANCE'] = `${teamA} & Draw`;
            } else {
                outcomes['DOUBLE_CHANCE'] = `${teamB} & Draw`;
            }

            // 6. FIRST_GOAL (First Goalscorer)
            if (homeScore === 0 && awayScore === 0) {
                outcomes['FIRST_GOAL'] = 'No Goal';
            } else if (homeScore > 0 && awayScore === 0) {
                outcomes['FIRST_GOAL'] = teamA;
            } else if (awayScore > 0 && homeScore === 0) {
                outcomes['FIRST_GOAL'] = teamB;
            } else {
                // Both teams scored. We query play-by-play to determine first goalscorer.
                try {
                    const timelineUrl = `${SPORTRADAR_BASE_URL}/sport_events/${matchedSrEvent.sport_event.id}/timeline.json?api_key=${SPORTRADAR_API_KEY}`;
                    const timelineRes = await fetch(timelineUrl);
                    if (timelineRes.ok) {
                        const timelineData = await timelineRes.json();
                        const firstGoalEvent = (timelineData.timeline || []).find(e => e.type === 'goal');
                        if (firstGoalEvent) {
                            outcomes['FIRST_GOAL'] = (firstGoalEvent.competitor?.qualifier === 'home') ? teamA : teamB;
                        }
                    }
                } catch (e) {
                    writeLog(`[WARNING] Failed to query play-by-play timeline for match ${matchedSrEvent.sport_event.id}: ${e.message}`);
                }
                
                if (!outcomes['FIRST_GOAL']) {
                    outcomes['FIRST_GOAL'] = 'No Goal';
                }
            }

            writeLog(`[OUTCOMES] Calculated Outcomes for ID ${dbMarket.id}: ${JSON.stringify(outcomes)}`);

            // --- 5. Database Payout & Resolution Transaction ---
            const resolvedKeys = Object.keys(outcomes);
            const resolvedMarketsStr = resolvedKeys.join(',');

            // Start payouts for all PENDING predictions on this market
            const { rows: pendingPreds } = await sql`
                SELECT id, "walletAddress", prediction, "predictionType" 
                FROM predictions 
                WHERE "marketId" = ${dbMarket.id} AND status = 'PENDING'
            `;

            writeLog(`[PAYOUT] Found ${pendingPreds.length} pending user predictions for match ID ${dbMarket.id}.`);

            for (const pred of pendingPreds) {
                const pType = pred.predictionType;
                let isWinner = false;

                if (pType === 'DOUBLE_CHANCE' && outcomes['DOUBLE_CHANCE'] === 'DRAW') {
                    isWinner = pred.prediction.includes('Draw');
                } else {
                    isWinner = pred.prediction === outcomes[pType];
                }

                if (isWinner) {
                    await sql`UPDATE predictions SET status = 'WON', "updatedAt" = CURRENT_TIMESTAMP WHERE id = ${pred.id}`;
                    
                    const lockRes = await sql`SELECT tier FROM locks WHERE "walletAddress" = ${pred.walletAddress} AND status = 'ACTIVE'`;
                    let points = 100;
                    let activeTier = 0;
                    if (lockRes.rowCount > 0) {
                        const tier = lockRes.rows[0].tier;
                        activeTier = tier;
                        if (tier === 3) points = 110;
                        else if (tier === 4) points = 125;
                    }
                    await sql`UPDATE users SET points = points + ${points} WHERE "walletAddress" = ${pred.walletAddress}`;
                    writeLog(`[WINNER] Pred ID: ${pred.id} | Wallet: ${pred.walletAddress.slice(0,6)}... | Type: ${pType} | Prediction: ${pred.prediction} | Points: +${points} (Tier ${activeTier})`);
                } else {
                    await sql`UPDATE predictions SET status = 'LOST', "updatedAt" = CURRENT_TIMESTAMP WHERE id = ${pred.id}`;
                    writeLog(`[LOSER] Pred ID: ${pred.id} | Wallet: ${pred.walletAddress.slice(0,6)}... | Type: ${pType} | Prediction: ${pred.prediction}`);
                }
                resolvedCount++;
            }

            // Update market info with final scores and mark as closed
            await sql`
                UPDATE markets 
                SET "scoreA" = ${homeScore}, 
                    "scoreB" = ${awayScore}, 
                    status = 'RESOLVED',
                    "resolvedMarkets" = ${resolvedMarketsStr},
                    "resolvedOutcomes" = ${JSON.stringify(outcomes)}
                WHERE id = ${dbMarket.id}
            `;
            writeLog(`[RESOLVED] Market ID ${dbMarket.id} successfully locked and updated to RESOLVED.`);
            processedMatches++;
        }

        writeLog(`[SUCCESS] Sync completed. Processed: ${processedMatches} markets, Resolved: ${resolvedCount} user predictions.`);
        return NextResponse.json({
            success: true,
            message: `Successfully synchronized ${processedMatches} matches. Resolved ${resolvedCount} user predictions automatically.`
        });

    } catch (error) {
        writeLog(`[CRITICAL] Server error in Sync route: ${error.message}`);
        console.error("POST /api/admin/sportradar-sync error:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
