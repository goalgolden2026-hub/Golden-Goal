import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '15e24fe1f1msh75f445d3e3d398dp1968d3jsn73f855695703';
const SPORT_API_HOST = 'sportapi7.p.rapidapi.com';

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
    if (!name) return '';
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\band\b/g, "")
        .replace(/[^a-z0-9]/g, "")
        .replace(/turkiye/g, "turkey")
        .replace(/turkiya/g, "turkey");
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

        // 1. Fetch daily schedule from Sofascore via RapidAPI
        const sportradarUrl = `https://${SPORT_API_HOST}/api/v1/sport/football/scheduled-events/${date}`;
        const srResponse = await fetch(sportradarUrl, {
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': SPORT_API_HOST
            },
            cache: 'no-store'
        });
        if (!srResponse.ok) {
            writeLog(`[ERROR] Sofascore API schedule request failed: ${srResponse.statusText}`);
            return NextResponse.json({ success: false, error: `Sofascore API error: ${srResponse.statusText}` }, { status: srResponse.status });
        }
        const srData = await srResponse.json();
        const srEvents = srData.events || [];
        writeLog(`[FETCH] Successfully fetched Sofascore schedule. Found ${srEvents.length} daily events.`);

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

        // 3. Match and Sync database fixtures with Sofascore events
        for (const dbMarket of dbMarkets) {
            const dbA = normalizeName(dbMarket.teamA);
            const dbB = normalizeName(dbMarket.teamB);

            const matchedEvent = srEvents.find(event => {
                const home = normalizeName(event.homeTeam?.name || '');
                const away = normalizeName(event.awayTeam?.name || '');
                
                const match1 = (home === dbA || home.includes(dbA) || dbA.includes(home)) && 
                               (away === dbB || away.includes(dbB) || dbB.includes(away));
                const match2 = (home === dbB || home.includes(dbB) || dbB.includes(home)) && 
                               (away === dbA || away.includes(dbA) || dbA.includes(away));
                return match1 || match2;
            });

            if (!matchedEvent) {
                continue;
            }

            const eventStatus = matchedEvent.status || {};
            writeLog(`[MATCH] Found Sofascore match for DB Market ID ${dbMarket.id} (${dbMarket.teamA} vs ${dbMarket.teamB}). Status type: ${eventStatus.type} | description: ${eventStatus.description}`);
            
            // Only process matches that are fully concluded
            if (eventStatus.type !== 'finished') {
                writeLog(`[SKIP] Match ID ${dbMarket.id} is not fully finished yet. Skipping resolution.`);
                continue;
            }

            const homeScore = parseInt(matchedEvent.homeScore?.current ?? 0);
            const awayScore = parseInt(matchedEvent.awayScore?.current ?? 0);
            const teamA = dbMarket.teamA;
            const teamB = dbMarket.teamB;
            
            // Order check for DB A/B compared to home/away
            const homeName = normalizeName(matchedEvent.homeTeam?.name || '');
            const isHomeDbA = homeName === dbA || homeName.includes(dbA) || dbA.includes(homeName);
            
            const goalsA = isHomeDbA ? homeScore : awayScore;
            const goalsB = isHomeDbA ? awayScore : homeScore;
            
            writeLog(`[SCORE] Match ID ${dbMarket.id} ended. Score: ${teamA} ${goalsA} - ${goalsB} ${teamB}`);

            // --- 4. Resolve the 6 Prediction Sub-Markets ---
            const outcomes = {};

            // 1. MAIN (Match Result)
            if (goalsA > goalsB) outcomes['MAIN'] = teamA;
            else if (goalsB > goalsA) outcomes['MAIN'] = teamB;
            else outcomes['MAIN'] = 'Draw';

            // 2. TOTAL_GOALS (Over/Under 2.5)
            outcomes['TOTAL_GOALS'] = (goalsA + goalsB >= 3) ? 'Over 2.5' : 'Under 2.5';

            // 3. BTTS (Both Teams to Score)
            outcomes['BTTS'] = (goalsA > 0 && goalsB > 0) ? 'Yes' : 'No';

            // 4. FIRST_HALF (First Half Winner)
            const fhHome = parseInt(matchedEvent.homeScore?.period1 ?? 0);
            const fhAway = parseInt(matchedEvent.awayScore?.period1 ?? 0);
            const fhGoalsA = isHomeDbA ? fhHome : fhAway;
            const fhGoalsB = isHomeDbA ? fhAway : fhHome;
            if (fhGoalsA > fhGoalsB) outcomes['FIRST_HALF'] = teamA;
            else if (fhGoalsB > fhGoalsA) outcomes['FIRST_HALF'] = teamB;
            else outcomes['FIRST_HALF'] = 'Draw';

            // 5. DOUBLE_CHANCE (Double Chance)
            if (goalsA === goalsB) {
                outcomes['DOUBLE_CHANCE'] = 'DRAW';
            } else if (goalsA > goalsB) {
                outcomes['DOUBLE_CHANCE'] = `${teamA} & Draw`;
            } else {
                outcomes['DOUBLE_CHANCE'] = `${teamB} & Draw`;
            }

            // 6. FIRST_GOAL (First Goalscorer)
            if (goalsA === 0 && goalsB === 0) {
                outcomes['FIRST_GOAL'] = 'No Goal';
            } else if (goalsA > 0 && goalsB === 0) {
                outcomes['FIRST_GOAL'] = teamA;
            } else if (goalsB > 0 && goalsA === 0) {
                outcomes['FIRST_GOAL'] = teamB;
            } else {
                // Both teams scored. We query play-by-play to determine first goalscorer.
                try {
                    const response = await fetch(`https://${SPORT_API_HOST}/api/v1/event/${matchedEvent.id}/incidents`, {
                        headers: {
                            'x-rapidapi-key': RAPIDAPI_KEY,
                            'x-rapidapi-host': SPORT_API_HOST
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const goals = (data.incidents || [])
                            .filter(i => i.incidentType === 'goal')
                            .sort((a, b) => a.time - b.time);
                        if (goals.length > 0) {
                            const firstGoalHome = goals[0].isHome;
                            outcomes['FIRST_GOAL'] = (firstGoalHome === isHomeDbA) ? teamA : teamB;
                        }
                    }
                } catch (e) {
                    writeLog(`[WARNING] Failed to query play-by-play timeline for match ${matchedEvent.id}: ${e.message}`);
                }
                
                if (!outcomes['FIRST_GOAL']) {
                    outcomes['FIRST_GOAL'] = isHomeDbA ? teamA : teamB;
                }
            }

            writeLog(`[OUTCOMES] Calculated Outcomes for ID ${dbMarket.id}: ${JSON.stringify(outcomes)}`);

            // --- 5. Database Payout & Resolution Transaction ---
            const resolvedKeys = Object.keys(outcomes);
            const resolvedMarketsStr = resolvedKeys.join(',');

            // Start payouts for all PENDING predictions on this market (selecting pointsReward)
            const { rows: pendingPreds } = await sql`
                SELECT id, "walletAddress", prediction, "predictionType", "pointsReward" 
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
                    const basePoints = pred.pointsReward || 100;
                    let points = basePoints;
                    let activeTier = 0;
                    if (lockRes.rowCount > 0) {
                        const tier = lockRes.rows[0].tier;
                        activeTier = tier;
                        if (tier === 3) points = Math.round(basePoints * 1.10);
                        else if (tier === 4) points = Math.round(basePoints * 1.25);
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
                SET "scoreA" = ${goalsA}, 
                    "scoreB" = ${goalsB}, 
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
