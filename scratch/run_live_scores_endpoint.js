const fs = require('fs');
const path = require('path');

// Parse .env.local relative to this script
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
                value = value.substring(1, value.length - 1);
            }
            process.env[key] = value;
        }
    });
}

const { sql } = require('@vercel/postgres');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '15e24fe1f1msh75f445d3e3d398dp1968d3jsn73f855695703';
const SPORT_API_HOST = 'sportapi7.p.rapidapi.com';

function normalizeTeamName(name) {
    if (!name) return '';
    const normalized = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\band\b/g, ' ')
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/turkiye/g, 'turkey')
        .replace(/turkiya/g, 'turkey')
        .trim();
    if (normalized === 'cabo verde' || normalized === 'caboverde') {
        return 'cape verde';
    }
    return normalized;
}

function calculateElapsedMinutes(event) {
    if (!event.time || !event.startTimestamp) return 0;
    const nowSeconds = Math.floor(Date.now() / 1000);
    const desc = event.status?.description?.toLowerCase();
    
    if (desc === 'ht' || desc === 'halftime') return 45;
    if (desc === 'ended' || event.status?.type === 'finished') return 90;
    
    if (event.lastPeriod === 'period1') {
        const startTimestamp = event.time?.currentPeriodStartTimestamp || event.startTimestamp;
        const diff = Math.floor((nowSeconds - startTimestamp) / 60);
        return Math.max(0, Math.min(45, diff));
    } else if (event.lastPeriod === 'period2') {
        const start2nd = event.time.currentPeriodStartTimestamp || (event.startTimestamp + 60 * 60);
        const diff = Math.floor((nowSeconds - start2nd) / 60);
        return Math.max(45, Math.min(90, 45 + diff));
    }
    return 0;
}

async function runGET() {
    try {
        const now = Date.now();
        console.log("Current time:", new Date(now).toISOString());

        // 1. Fetch active markets
        const { rows: activeMarkets } = await sql`
            SELECT id, "teamA", "teamB", "matchDate", status 
            FROM markets 
            WHERE status = 'ACTIVE' OR "scoreA" IS NULL OR "scoreB" IS NULL
        `;
        console.log(`Found ${activeMarkets.length} active markets.`);

        if (activeMarkets.length === 0) {
            console.log("No active markets. Returning empty.");
            return;
        }

        const hasLiveMatch = activeMarkets.some(market => {
            const matchTime = new Date(market.matchDate).getTime();
            const timeDiff = now - matchTime;
            return timeDiff >= 0 && timeDiff < 3 * 60 * 60 * 1000;
        });
        console.log("hasLiveMatch:", hasLiveMatch);

        const CACHE_TTL = hasLiveMatch ? 120000 : 600000;
        console.log("CACHE_TTL:", CACHE_TTL);

        const cacheRes = await sql`
            SELECT data, "updatedAt",
                   EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - "updatedAt")) * 1000 AS "cacheAgeMs"
            FROM live_scores_cache 
            WHERE key = 'global_live_scores'
        `;
        
        if (cacheRes.rowCount > 0) {
            const cache = cacheRes.rows[0];
            const cacheAgeMs = Number(cache.cacheAgeMs);
            console.log(`Cache age: ${cacheAgeMs} ms (updatedAt: ${cache.updatedAt})`);
            if (cacheAgeMs < CACHE_TTL) {
                console.log("Serving from cache (not expired).");
                return;
            }
        }

        console.log("Cache expired or missing. Attempting API update...");

        try {
            await sql`
                UPDATE live_scores_cache 
                SET "updatedAt" = CURRENT_TIMESTAMP 
                WHERE key = 'global_live_scores'
            `;
            console.log("Updated live_scores_cache updatedAt timestamp.");
        } catch (e) {
            console.error("Failed to acquire cache update lock:", e);
        }

        const liveScores = {};

        const activeMatchDatesToQuery = activeMarkets.filter(market => {
            const matchTime = new Date(market.matchDate).getTime();
            const timeDiff = now - matchTime;
            return timeDiff >= -15 * 60 * 1000 && timeDiff < 7 * 24 * 60 * 60 * 1000;
        });
        console.log(`Markets near-term to query: ${activeMatchDatesToQuery.length}`);

        const uniqueDates = Array.from(new Set(activeMatchDatesToQuery.map(market => {
            const dateObj = new Date(market.matchDate);
            return dateObj.toISOString().split('T')[0];
        })));
        console.log("Unique dates to query:", uniqueDates);

        let fetchSuccess = true;
        let allEvents = [];

        if (uniqueDates.length > 0) {
            for (const targetDate of uniqueDates) {
                try {
                    const url = `https://${SPORT_API_HOST}/api/v1/sport/football/scheduled-events/${targetDate}`;
                    console.log(`Fetching ${url}...`);
                    const response = await fetch(url, {
                        headers: {
                            'x-rapidapi-key': RAPIDAPI_KEY,
                            'x-rapidapi-host': SPORT_API_HOST
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.events) {
                            allEvents = allEvents.concat(data.events);
                            console.log(`Fetched ${data.events.length} events for ${targetDate}`);
                        }
                    } else {
                        const errBody = await response.text();
                        console.error(`RapidAPI call for date ${targetDate} returned status ${response.status}:`, errBody);
                        fetchSuccess = false;
                    }
                } catch (e) {
                    console.error(`Failed to fetch Sofascore schedule for ${targetDate}:`, e);
                    fetchSuccess = false;
                }
            }
        }

        if (!fetchSuccess && cacheRes.rowCount > 0) {
            console.warn("Using expired live-scores database cache due to API sync failure.");
            return;
        }

        // Match markets
        for (const market of activeMarkets) {
            const dbA = normalizeTeamName(market.teamA);
            const dbB = normalizeTeamName(market.teamB);

            const matchedEvent = allEvents.find(event => {
                const home = normalizeTeamName(event.homeTeam?.name || '');
                const away = normalizeTeamName(event.awayTeam?.name || '');
                
                const match1 = (home === dbA || home.includes(dbA) || dbA.includes(home)) && 
                               (away === dbB || away.includes(dbB) || dbB.includes(away));
                const match2 = (home === dbB || home.includes(dbB) || dbB.includes(home)) && 
                               (away === dbA || away.includes(dbA) || dbA.includes(away));
                return match1 || match2;
            });

            if (matchedEvent) {
                const statusType = matchedEvent.status?.type;
                const statusDesc = matchedEvent.status?.description;
                const homeScore = matchedEvent.homeScore?.current ?? 0;
                const awayScore = matchedEvent.awayScore?.current ?? 0;

                const homeName = normalizeTeamName(matchedEvent.homeTeam?.name || '');
                const isHomeDbA = homeName === dbA || homeName.includes(dbA) || dbA.includes(homeName);
                
                const goalsA = isHomeDbA ? homeScore : awayScore;
                const goalsB = isHomeDbA ? awayScore : homeScore;

                let goals = [];
                console.log(`Matched market ${market.id} (${market.teamA} vs ${market.teamB}) to event ${matchedEvent.id}. Status: ${statusType}`);
                
                if ((statusType === 'inprogress' || statusType === 'finished') && (homeScore > 0 || awayScore > 0)) {
                    try {
                        const incUrl = `https://${SPORT_API_HOST}/api/v1/event/${matchedEvent.id}/incidents`;
                        console.log(`Fetching incidents for event ${matchedEvent.id} from ${incUrl}...`);
                        const incResponse = await fetch(incUrl, {
                            headers: {
                                'x-rapidapi-key': RAPIDAPI_KEY,
                                'x-rapidapi-host': SPORT_API_HOST
                            }
                        });
                        if (incResponse.ok) {
                            const incData = await incResponse.json();
                            if (incData.incidents) {
                                const goalIncidents = incData.incidents
                                    .filter(inc => inc.incidentType === 'goal')
                                    .sort((a, b) => (a.time + (a.addedTime || 0)/100) - (b.time + (b.addedTime || 0)/100));
                                
                                goals = goalIncidents.map(inc => ({
                                    time: inc.time,
                                    addedTime: inc.addedTime || null,
                                    player: inc.player?.name || inc.playerName || 'Unknown Player',
                                    isHome: inc.isHome ? isHomeDbA : !isHomeDbA,
                                    incidentClass: inc.incidentClass || 'regular'
                                }));
                            }
                        }
                    } catch (e) {
                        console.error(`Failed to fetch incidents for event ${matchedEvent.id}:`, e);
                    }
                }

                if (statusType === 'inprogress') {
                    liveScores[market.id] = {
                        goalsA,
                        goalsB,
                        elapsed: calculateElapsedMinutes(matchedEvent),
                        status: 'LIVE',
                        matchStatus: statusDesc || '1st half',
                        goals,
                        startTimestamp: market.matchDate ? new Date(market.matchDate).getTime() : null,
                        currentPeriodStartTimestamp: matchedEvent.time?.currentPeriodStartTimestamp ? matchedEvent.time.currentPeriodStartTimestamp * 1000 : null,
                        lastPeriod: matchedEvent.lastPeriod || 'period1'
                    };
                } else if (statusType === 'finished') {
                    liveScores[market.id] = {
                        goalsA,
                        goalsB,
                        elapsed: 90,
                        status: 'FT',
                        goals
                    };
                } else {
                    // Check if match should be live based on kickoff time (e.g. now >= matchDate and now < matchDate + 120 minutes)
                    const matchTime = new Date(market.matchDate).getTime();
                    const elapsedMs = now - matchTime;
                    if (elapsedMs >= 0 && elapsedMs < 120 * 60 * 1000) {
                        const elapsedMins = Math.floor(elapsedMs / 60000);
                        liveScores[market.id] = {
                            goalsA: 0,
                            goalsB: 0,
                            elapsed: Math.min(90, elapsedMins),
                            status: 'LIVE',
                            matchStatus: elapsedMins < 45 ? '1st half' : elapsedMins < 60 ? 'halftime' : '2nd half',
                            goals: []
                        };
                    } else {
                        liveScores[market.id] = {
                            goalsA: null,
                            goalsB: null,
                            elapsed: null,
                            status: 'UPCOMING'
                        };
                    }
                }
            } else {
                const matchTime = new Date(market.matchDate).getTime();
                const diffMs = Math.abs(now - matchTime);
                const isNearTerm = diffMs < 7 * 24 * 60 * 60 * 1000;

                const elapsedMs = now - matchTime;
                if (elapsedMs >= 0 && elapsedMs < 120 * 60 * 1000) {
                    const elapsedMins = Math.floor(elapsedMs / 60000);
                    liveScores[market.id] = {
                        goalsA: 0,
                        goalsB: 0,
                        elapsed: Math.min(90, elapsedMins),
                        status: 'LIVE',
                        matchStatus: elapsedMins < 45 ? '1st half' : elapsedMins < 60 ? 'halftime' : '2nd half',
                        goals: []
                    };
                } else {
                    liveScores[market.id] = {
                        goalsA: null,
                        goalsB: null,
                        elapsed: null,
                        status: isNearTerm ? 'OFFLINE' : 'UPCOMING'
                    };
                }
            }
        }

        console.log("Updating live_scores_cache with new scores:", JSON.stringify(liveScores, null, 2));

        await sql`
            INSERT INTO live_scores_cache (key, data, "updatedAt") 
            VALUES ('global_live_scores', ${JSON.stringify(liveScores)}, CURRENT_TIMESTAMP)
            ON CONFLICT (key) 
            DO UPDATE SET data = EXCLUDED.data, "updatedAt" = CURRENT_TIMESTAMP
        `;
        console.log("Successfully updated cache in DB!");

    } catch (err) {
        console.error("Error in runGET:", err);
    }
    process.exit(0);
}

runGET();
