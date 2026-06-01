import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'fb0b6761c9msha29978207b28aa6p17856bjsnca9d44b79409';
const SPORT_API_HOST = 'sportapi7.p.rapidapi.com';

function normalizeTeamName(name) {
    if (!name) return '';
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, ' ')
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

// In-memory cache to respect API rate limits (60 seconds cache)
let liveCache = null;
let lastCacheTime = 0;
const CACHE_TTL = 60 * 1000;

export async function GET(request) {
    try {
        const sql = await getDb();
        const { rows: activeMarkets } = await sql`
            SELECT id, "teamA", "teamB", "matchDate", status 
            FROM markets 
            WHERE status = 'ACTIVE' OR "scoreA" IS NULL OR "scoreB" IS NULL
        `;

        if (activeMarkets.length === 0) {
            return NextResponse.json({ success: true, scores: {} });
        }

        const now = Date.now();
        const liveScores = {};

        // Serve from cache if valid
        if (liveCache && (now - lastCacheTime < CACHE_TTL)) {
            return NextResponse.json({ success: true, scores: liveCache });
        }

        // Collect unique match dates (YYYY-MM-DD) from our database markets
        const uniqueDates = Array.from(new Set(activeMarkets.map(market => {
            const dateObj = new Date(market.matchDate);
            return dateObj.toISOString().split('T')[0];
        })));

        // 1. Fetch football schedules from Sofascore via RapidAPI for those dates
        let allEvents = [];
        for (const targetDate of uniqueDates) {
            try {
                const response = await fetch(`https://${SPORT_API_HOST}/api/v1/sport/football/scheduled-events/${targetDate}`, {
                    headers: {
                        'x-rapidapi-key': RAPIDAPI_KEY,
                        'x-rapidapi-host': SPORT_API_HOST
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.events) {
                        allEvents = allEvents.concat(data.events);
                    }
                }
            } catch (e) {
                console.error(`Failed to fetch Sofascore schedule for ${targetDate}:`, e);
            }
        }

        // 2. Match our database markets
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

                // Let's identify the home/away order compared to our DB
                const homeName = normalizeTeamName(matchedEvent.homeTeam?.name || '');
                const isHomeDbA = homeName === dbA || homeName.includes(dbA) || dbA.includes(homeName);
                
                // Align scores to match teamA and teamB order in our database
                const goalsA = isHomeDbA ? homeScore : awayScore;
                const goalsB = isHomeDbA ? awayScore : homeScore;

                if (statusType === 'inprogress') {
                    // Match is currently live
                    liveScores[market.id] = {
                        goalsA,
                        goalsB,
                        elapsed: calculateElapsedMinutes(matchedEvent),
                        status: 'LIVE',
                        matchStatus: statusDesc || '1st half'
                    };
                } else if (statusType === 'finished') {
                    // Match is concluded
                    liveScores[market.id] = {
                        goalsA,
                        goalsB,
                        elapsed: 90,
                        status: 'FT'
                    };

                    // Trigger the auto-resolution background process asynchronously
                    try {
                        const matchDateStr = new Date(market.matchDate).toISOString().split('T')[0];
                        fetch(`${request.nextUrl.origin}/api/admin/sportradar-sync`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ date: matchDateStr })
                        }).catch(e => console.error("Async background sync failed:", e));
                    } catch (e) {
                        console.error("Failed to dispatch async background resolution:", e);
                    }
                } else {
                    // Upcoming or postponed
                    liveScores[market.id] = {
                        goalsA: null,
                        goalsB: null,
                        elapsed: null,
                        status: 'UPCOMING'
                    };
                }
            } else {
                // Offline fallback
                liveScores[market.id] = {
                    goalsA: null,
                    goalsB: null,
                    elapsed: null,
                    status: 'OFFLINE'
                };
            }
        }

        // Cache update
        liveCache = liveScores;
        lastCacheTime = now;

        return NextResponse.json({ success: true, scores: liveScores }, { status: 200 });
    } catch (error) {
        console.error("GET /api/markets/live-scores error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch live scores" }, { status: 500 });
    }
}
