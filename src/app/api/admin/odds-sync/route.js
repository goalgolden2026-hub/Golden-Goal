import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const ODDS_API_KEY = process.env.ODDS_API_KEY || '56a72e46a9bd58c61a976e1aa045f47d';
const SPORT_KEY = 'soccer_fifa_world_cup';

function writeLog(message) {
    try {
        const logFilePath = path.join(process.cwd(), 'odds_sync_logs.txt');
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`, 'utf8');
    } catch (e) {
        console.error("Local odds logger failed:", e);
    }
}

// Helper to normalize and match team names
function normalizeName(name) {
    if (!name) return '';
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .replace(/turkiye/g, "turkey")
        .replace(/turkiya/g, "turkey")
        .replace(/czechia/g, "czechrepublic");
}

export async function POST(request) {
    try {
        writeLog("[START] Odds sync triggered.");

        // 1. Fetch World Cup odds from OddsAPI (H2H and Totals)
        const url = `https://api.the-odds-api.com/v4/sports/${SPORT_KEY}/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h,totals`;
        const response = await fetch(url);
        
        if (!response.ok) {
            const errText = await response.text();
            writeLog(`[ERROR] OddsAPI request failed: ${response.statusText} - ${errText}`);
            return NextResponse.json({ success: false, error: `OddsAPI request failed: ${response.statusText}` }, { status: response.status });
        }

        const oddsData = await response.json();
        writeLog(`[FETCH] Successfully fetched odds from OddsAPI. Found ${oddsData.length} matches.`);

        const sql = await getDb();

        // 2. Fetch all active markets from our database
        const dbMarketsRes = await sql`
            SELECT id, "teamA", "teamB"
            FROM markets 
            WHERE status = 'ACTIVE'
        `;
        const dbMarkets = dbMarketsRes.rows;
        writeLog(`[DB] Found ${dbMarkets.length} active markets in database.`);

        let matchedCount = 0;

        // 3. Match database markets with API odds and save derived outcomes
        for (const market of dbMarkets) {
            const dbA = normalizeName(market.teamA);
            const dbB = normalizeName(market.teamB);

            // Find matching event in OddsAPI response
            const matchedEvent = oddsData.find(event => {
                const home = normalizeName(event.home_team);
                const away = normalizeName(event.away_team);

                const match1 = (home === dbA || home.includes(dbA) || dbA.includes(home)) && 
                               (away === dbB || away.includes(dbB) || dbB.includes(away));
                const match2 = (home === dbB || home.includes(dbB) || dbB.includes(home)) && 
                               (away === dbA || away.includes(dbA) || dbA.includes(away));
                return match1 || match2;
            });

            if (!matchedEvent) {
                writeLog(`[WARN] No odds match found for DB Market: ${market.teamA} vs ${market.teamB}`);
                continue;
            }

            // Find bookmaker containing our markets (look for Marathon Bet, Pinnacle, or first available)
            let bookmaker = matchedEvent.bookmakers.find(b => b.key === 'marathonbet') ||
                            matchedEvent.bookmakers.find(b => b.key === 'pinnacle') ||
                            matchedEvent.bookmakers[0];

            if (!bookmaker) {
                writeLog(`[WARN] No bookmaker odds details found for match: ${market.teamA} vs ${market.teamB}`);
                continue;
            }

            const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
            const totalsMarket = bookmaker.markets.find(m => m.key === 'totals');

            if (!h2hMarket) {
                writeLog(`[WARN] H2H market missing for match: ${market.teamA} vs ${market.teamB}`);
                continue;
            }

            // Extract base odds
            const homeOddsOutcome = h2hMarket.outcomes.find(o => normalizeName(o.name) === normalizeName(matchedEvent.home_team));
            const awayOddsOutcome = h2hMarket.outcomes.find(o => normalizeName(o.name) === normalizeName(matchedEvent.away_team));
            const drawOddsOutcome = h2hMarket.outcomes.find(o => o.name.toLowerCase() === 'draw');

            if (!homeOddsOutcome || !awayOddsOutcome || !drawOddsOutcome) {
                writeLog(`[WARN] H2H outcomes missing for match: ${market.teamA} vs ${market.teamB}`);
                continue;
            }

            const isHomeTeamA = normalizeName(matchedEvent.home_team) === dbA || normalizeName(matchedEvent.home_team).includes(dbA) || dbA.includes(normalizeName(matchedEvent.home_team));

            const h2h_A = isHomeTeamA ? homeOddsOutcome.price : awayOddsOutcome.price;
            const h2h_B = isHomeTeamA ? awayOddsOutcome.price : homeOddsOutcome.price;
            const h2h_draw = drawOddsOutcome.price;

            // Totals
            let total_over = 1.90;
            let total_under = 1.90;
            if (totalsMarket) {
                const overOutcome = totalsMarket.outcomes.find(o => o.name.toLowerCase() === 'over');
                const underOutcome = totalsMarket.outcomes.find(o => o.name.toLowerCase() === 'under');
                if (overOutcome) total_over = overOutcome.price;
                if (underOutcome) total_under = underOutcome.price;
            }

            // Calculate probabilities for Double Chance derivation
            const P1 = 1 / h2h_A;
            const PX = 1 / h2h_draw;
            const P2 = 1 / h2h_B;

            const dc_A_draw = Math.max(1.01, parseFloat((1 / (P1 + PX)).toFixed(2)));
            const dc_B_draw = Math.max(1.01, parseFloat((1 / (P2 + PX)).toFixed(2)));

            // Calculate BTTS odds
            const btts_yes = Math.max(1.01, parseFloat((total_over * 1.1).toFixed(2)));
            const btts_no = Math.max(1.01, parseFloat((total_under * 0.95).toFixed(2)));

            // Calculate First Half Winner odds
            const fh_draw = Math.max(1.01, parseFloat((h2h_draw * 0.6).toFixed(2)));
            const fh_A = Math.max(1.01, parseFloat((h2h_A * 1.5).toFixed(2)));
            const fh_B = Math.max(1.01, parseFloat((h2h_B * 1.5).toFixed(2)));

            // Calculate First Goal odds
            const fg_A = Math.max(1.01, parseFloat((h2h_A * 0.9).toFixed(2)));
            const fg_B = Math.max(1.01, parseFloat((h2h_B * 0.9).toFixed(2)));
            const fg_none = Math.max(1.01, parseFloat((h2h_draw * 2.2).toFixed(2)));

            // Construct final odds JSON structure mapped to frontend prediction option strings
            const oddsObj = {
                "MAIN": {
                    [market.teamA]: h2h_A,
                    "Draw": h2h_draw,
                    [market.teamB]: h2h_B
                },
                "DOUBLE_CHANCE": {
                    [`${market.teamA} & Draw`]: dc_A_draw,
                    [`${market.teamB} & Draw`]: dc_B_draw
                },
                "TOTAL_GOALS": {
                    "Under 2.5": total_under,
                    "Over 2.5": total_over
                },
                "BTTS": {
                    "Yes": btts_yes,
                    "No": btts_no
                },
                "FIRST_HALF": {
                    [market.teamA]: fh_A,
                    "Draw": fh_draw,
                    [market.teamB]: fh_B
                },
                "FIRST_GOAL": {
                    [market.teamA]: fg_A,
                    "No Goal": fg_none,
                    [market.teamB]: fg_B
                }
            };

            // Save to DB
            await sql`
                UPDATE markets 
                SET odds = ${JSON.stringify(oddsObj)}
                WHERE id = ${market.id}
            `;
            matchedCount++;
            writeLog(`[SYNC] Matched and updated odds for Market ID ${market.id} (${market.teamA} vs ${market.teamB}).`);
        }

        writeLog(`[SUCCESS] Odds sync completed. Matched and updated ${matchedCount} markets.`);
        return NextResponse.json({ success: true, message: `Odds sync completed successfully. Matched and updated ${matchedCount} markets.` });

    } catch (error) {
        writeLog(`[CRITICAL] Server error in Odds sync route: ${error.message}`);
        console.error("POST /api/admin/odds-sync error:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
