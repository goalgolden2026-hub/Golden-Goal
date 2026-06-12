import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '15e24fe1f1msh75f445d3e3d398dp1968d3jsn73f855695703';
const SPORT_API_HOST = 'sportapi7.p.rapidapi.com';

function normalizeTeamName(name) {
    if (!name) return '';
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\band\b/g, ' ')
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/turkiye/g, 'turkey')
        .replace(/turkiya/g, 'turkey')
        .trim();
}

function calculateElapsedMinutes(event) {
    if (!event.time || !event.startTimestamp) return 0;
    const nowSeconds = Math.floor(Date.now() / 1000);
    const desc = event.status?.description?.toLowerCase();
    
    if (desc === 'ht' || desc === 'halftime') return 45;
    if (desc === 'ended' || event.status?.type === 'finished') return 90;
    
    if (event.lastPeriod === 'period1') {
        const diff = Math.floor((nowSeconds - event.startTimestamp) / 60);
        return Math.max(0, Math.min(45, diff));
    } else if (event.lastPeriod === 'period2') {
        const start2nd = event.time.currentPeriodStartTimestamp || (event.startTimestamp + 60 * 60);
        const diff = Math.floor((nowSeconds - start2nd) / 60);
        return Math.max(45, Math.min(90, 45 + diff));
    }
    return 0;
}

export async function GET(request) {
    try {
        const sql = await getDb();
        const now = Date.now();

        // 1. Fetch active markets first to check if there are live matches
        const { rows: activeMarkets } = await sql`
            SELECT id, "teamA", "teamB", "matchDate", status 
            FROM markets 
            WHERE status = 'ACTIVE' OR "scoreA" IS NULL OR "scoreB" IS NULL
        `;

        if (activeMarkets.length === 0) {
            return NextResponse.json({ success: true, scores: {} });
        }

        // Determine if any match is currently live (within 3 hours of kickoff)
        const hasLiveMatch = activeMarkets.some(market => {
            const matchTime = new Date(market.matchDate).getTime();
            const timeDiff = now - matchTime;
            return timeDiff >= 0 && timeDiff < 3 * 60 * 60 * 1000;
        });

        // 2. Check Database Cache
        // Save limits: 10 minutes cache when no matches are live, 2 minutes during live matches
        const CACHE_TTL = hasLiveMatch ? 120000 : 600000;
        
        const cacheRes = await sql`
            SELECT data, "updatedAt",
                   EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - "updatedAt")) * 1000 AS "cacheAgeMs"
            FROM live_scores_cache 
            WHERE key = 'global_live_scores'
        `;
        
        if (cacheRes.rowCount > 0) {
            const cache = cacheRes.rows[0];
            const cacheAgeMs = Number(cache.cacheAgeMs);
            if (cacheAgeMs < CACHE_TTL) {
                return NextResponse.json({ success: true, scores: cache.data }, { status: 200 });
            }
        }

        if (activeMarkets.length === 0) {
            return NextResponse.json({ success: true, scores: {} });
        }

        // Acquire a cache update lock immediately to prevent other concurrent requests 
        // from making parallel API fetches (cache stampede protection)
        try {
            await sql`
                UPDATE live_scores_cache 
                SET "updatedAt" = CURRENT_TIMESTAMP 
                WHERE key = 'global_live_scores'
            `;
        } catch (e) {
            console.error("Failed to acquire cache update lock:", e);
        }

        const liveScores = {};

        // 3. Identify dates to query.
        // We only query RapidAPI starting 15 minutes before kickoff and up to 24 hours after kickoff.
        // This prevents wasting API calls during the long pre-match lead-up.
        const activeMatchDatesToQuery = activeMarkets.filter(market => {
            const matchTime = new Date(market.matchDate).getTime();
            const timeDiff = now - matchTime;
            // Look look-ahead is 15 minutes, look-back is 7 days to cover delayed resolution
            return timeDiff >= -15 * 60 * 1000 && timeDiff < 7 * 24 * 60 * 60 * 1000;
        });

        const uniqueDates = Array.from(new Set(activeMatchDatesToQuery.map(market => {
            const dateObj = new Date(market.matchDate);
            return dateObj.toISOString().split('T')[0];
        })));

        let fetchSuccess = true;
        let allEvents = [];

        // 3. Query Sofascore scheduled events ONLY for near-term matches (if any exist)
        if (uniqueDates.length > 0) {
            for (const targetDate of uniqueDates) {
                try {
                    const response = await fetch(`https://${SPORT_API_HOST}/api/v1/sport/football/scheduled-events/${targetDate}`, {
                        headers: {
                            'x-rapidapi-key': RAPIDAPI_KEY,
                            'x-rapidapi-host': SPORT_API_HOST
                        },
                        cache: 'no-store'
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.events) {
                            allEvents = allEvents.concat(data.events);
                        }
                    } else {
                        const errBody = await response.json().catch(() => ({}));
                        console.error(`RapidAPI call for date ${targetDate} returned status ${response.status}:`, errBody);
                        // If quota is exceeded, fail gracefully to use old database cache
                        fetchSuccess = false;
                    }
                } catch (e) {
                    console.error(`Failed to fetch Sofascore schedule for ${targetDate}:`, e);
                    fetchSuccess = false;
                }
            }
        }

        // 4. If fetch failed (e.g., quota exceeded) and we have an old database cache, serve the old cache to keep the site online
        if (!fetchSuccess && cacheRes.rowCount > 0) {
            console.warn("Using expired live-scores database cache due to API sync failure (likely quota exceeded).");
            return NextResponse.json({ success: true, scores: cacheRes.rows[0].data }, { status: 200 });
        }


        // 5. Match our database markets
        for (const market of activeMarkets) {
            const dbA = normalizeTeamName(market.teamA);
            const dbB = normalizeTeamName(market.teamB);

            // Find event in allEvents
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
                if ((statusType === 'inprogress' || statusType === 'finished') && (homeScore > 0 || awayScore > 0)) {
                    try {
                        const incResponse = await fetch(`https://${SPORT_API_HOST}/api/v1/event/${matchedEvent.id}/incidents`, {
                            headers: {
                                'x-rapidapi-key': RAPIDAPI_KEY,
                                'x-rapidapi-host': SPORT_API_HOST
                            },
                            cache: 'no-store'
                        });
                        if (incResponse.ok) {
                            const incData = await incResponse.json();
                            if (incData.incidents) {
                                const goalIncidents = incData.incidents
                                    .filter(inc => inc.incidentType === 'goal')
                                    .sort((a, b) => {
                                        const timeA = a.time + (a.addedTime || 0) / 100;
                                        const timeB = b.time + (b.addedTime || 0) / 100;
                                        return timeA - timeB;
                                    });
                                
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
                        goals
                    };
                } else if (statusType === 'finished') {
                    liveScores[market.id] = {
                        goalsA,
                        goalsB,
                        elapsed: 90,
                        status: 'FT',
                        goals
                    };

                    // Await the auto-resolution process to prevent Vercel container shutdown from cutting it off
                    try {
                        const matchDateStr = new Date(market.matchDate).toISOString().split('T')[0];
                        await fetch(`${request.nextUrl.origin}/api/admin/sportradar-sync`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ date: matchDateStr })
                        }).catch(e => console.error("Background sync failed:", e));
                    } catch (e) {
                        console.error("Failed to dispatch background resolution:", e);
                    }
                } else {
                    liveScores[market.id] = {
                        goalsA: null,
                        goalsB: null,
                        elapsed: null,
                        status: 'UPCOMING'
                    };
                }
            } else {
                // If it is not within 7 days of kickoff, it is statically UPCOMING
                // If it IS close but not found in the feed, return OFFLINE fallback
                const matchTime = new Date(market.matchDate).getTime();
                const diffMs = Math.abs(now - matchTime);
                const isNearTerm = diffMs < 7 * 24 * 60 * 60 * 1000;

                liveScores[market.id] = {
                    goalsA: null,
                    goalsB: null,
                    elapsed: null,
                    status: isNearTerm ? 'OFFLINE' : 'UPCOMING'
                };
            }
        }

        // 6. Update Database Cache
        await sql`
            INSERT INTO live_scores_cache (key, data, "updatedAt") 
            VALUES ('global_live_scores', ${JSON.stringify(liveScores)}, CURRENT_TIMESTAMP)
            ON CONFLICT (key) 
            DO UPDATE SET data = EXCLUDED.data, "updatedAt" = CURRENT_TIMESTAMP
        `;

        return NextResponse.json({ success: true, scores: liveScores }, { status: 200 });
    } catch (error) {
        console.error("GET /api/markets/live-scores error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch live scores" }, { status: 500 });
    }
}
