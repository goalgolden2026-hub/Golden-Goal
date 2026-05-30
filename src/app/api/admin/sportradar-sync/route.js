import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const SPORTRADAR_API_KEY = process.env.SPORTRADAR_API_KEY || 'Et17n0p8lXDbQIPqyEqWjjaNjWHACZKBLBELV6J0';
const SPORTRADAR_BASE_URL = 'https://api.sportradar.com/soccer/trial/v4/en';

// Helper to normalize and match team names (e.g., "CA Racing de Cordoba" -> "caracingdecordoba" / "USA" -> "usa")
function normalizeName(name) {
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));
        const { date } = body; // Format: YYYY-MM-DD
        
        if (!date) {
            return NextResponse.json({ success: false, error: 'Missing date parameter' }, { status: 400 });
        }

        // 1. Fetch daily schedule from Sportradar
        const sportradarUrl = `${SPORTRADAR_BASE_URL}/schedules/${date}/schedules.json?api_key=${SPORTRADAR_API_KEY}`;
        const srResponse = await fetch(sportradarUrl);
        if (!srResponse.ok) {
            return NextResponse.json({ success: false, error: `Sportradar API error: ${srResponse.statusText}` }, { status: srResponse.status });
        }
        const srData = await srResponse.json();
        const srEvents = srData.schedules || [];

        const sql = await getDb();

        // 2. Fetch all active/pending markets from our database
        const dbMarketsRes = await sql`
            SELECT id, "teamA", "teamB", status 
            FROM markets 
            WHERE status = 'ACTIVE' OR "scoreA" IS NULL OR "scoreB" IS NULL
        `;
        const dbMarkets = dbMarketsRes.rows;

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

                return (
                    (dbA === normHome && dbB === normAway) ||
                    (dbA === normAway && dbB === normHome) ||
                    normHome.includes(dbA) || dbA.includes(normHome) ||
                    normAway.includes(dbB) || dbB.includes(normAway)
                );
            });

            if (!matchedSrEvent) continue;

            const eventStatus = matchedSrEvent.sport_event_status || {};
            
            // Only process matches that are fully concluded
            if (eventStatus.status !== 'closed' || eventStatus.match_status !== 'ended') {
                continue;
            }

            const homeScore = parseInt(eventStatus.home_score);
            const awayScore = parseInt(eventStatus.away_score);
            const teamA = dbMarket.teamA;
            const teamB = dbMarket.teamB;

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
                outcomes['FIRST_HALF'] = 'Draw'; // Fallback if periods are missing
            }

            // 5. DOUBLE_CHANCE (Double Chance)
            if (homeScore === awayScore) {
                outcomes['DOUBLE_CHANCE'] = 'DRAW'; // Handled dynamically in prediction payout transaction below
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
                    console.error(`Timeline error for event ${matchedSrEvent.sport_event.id}:`, e);
                }
                
                // Final safety fallback if timeline fails
                if (!outcomes['FIRST_GOAL']) {
                    outcomes['FIRST_GOAL'] = 'No Goal';
                }
            }

            // --- 5. Database Payout & Resolution Transaction ---
            const resolvedKeys = Object.keys(outcomes);
            const resolvedMarketsStr = resolvedKeys.join(',');

            // Start payouts for all PENDING predictions on this market
            const { rows: pendingPreds } = await sql`
                SELECT id, "walletAddress", prediction, "predictionType" 
                FROM predictions 
                WHERE "marketId" = ${dbMarket.id} AND status = 'PENDING'
            `;

            for (const pred of pendingPreds) {
                const pType = pred.predictionType;
                let isWinner = false;

                if (pType === 'DOUBLE_CHANCE' && outcomes['DOUBLE_CHANCE'] === 'DRAW') {
                    // Under a Draw outcome, both Double Chance predictions win
                    isWinner = pred.prediction.includes('Draw');
                } else {
                    isWinner = pred.prediction === outcomes[pType];
                }

                if (isWinner) {
                    // Update prediction to WON
                    await sql`UPDATE predictions SET status = 'WON', "updatedAt" = CURRENT_TIMESTAMP WHERE id = ${pred.id}`;
                    
                    // Fetch lock multiplier and award points
                    const lockRes = await sql`SELECT tier FROM locks WHERE "walletAddress" = ${pred.walletAddress} AND status = 'ACTIVE'`;
                    let points = 100;
                    if (lockRes.rowCount > 0) {
                        const tier = lockRes.rows[0].tier;
                        if (tier === 3) points = 110;
                        else if (tier === 4) points = 125;
                    }
                    await sql`UPDATE users SET points = points + ${points} WHERE "walletAddress" = ${pred.walletAddress}`;
                } else {
                    // Update prediction to LOST
                    await sql`UPDATE predictions SET status = 'LOST', "updatedAt" = CURRENT_TIMESTAMP WHERE id = ${pred.id}`;
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
            processedMatches++;
        }

        return NextResponse.json({
            success: true,
            message: `Successfully synchronized ${processedMatches} matches. Resolved ${resolvedCount} user predictions automatically.`
        });

    } catch (error) {
        console.error("POST /api/admin/sportradar-sync error:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
