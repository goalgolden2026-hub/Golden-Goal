import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SPORTRADAR_API_KEY = process.env.SPORTRADAR_API_KEY || 'Et17n0p8lXDbQIPqyEqWjjaNjWHACZKBLBELV6J0';
const SPORTRADAR_BASE_URL = 'https://api.sportradar.com/soccer/trial/v4/en';

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

        // 1. Fetch live matches from Sportradar
        let srLiveEvents = [];
        try {
            const liveUrl = `${SPORTRADAR_BASE_URL}/schedules/live/schedules.json?api_key=${SPORTRADAR_API_KEY}`;
            const response = await fetch(liveUrl);
            if (response.ok) {
                const data = await response.json();
                srLiveEvents = data.schedules || [];
            }
        } catch (e) {
            console.error("Failed to fetch live matches from Sportradar:", e);
        }

        // 2. We also fetch today's full schedule to detect finished matches for background auto-resolution
        let srDailyEvents = [];
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const dailyUrl = `${SPORTRADAR_BASE_URL}/schedules/${todayStr}/schedules.json?api_key=${SPORTRADAR_API_KEY}`;
            const response = await fetch(dailyUrl);
            if (response.ok) {
                const data = await response.json();
                srDailyEvents = data.schedules || [];
            }
        } catch (e) {
            console.error("Failed to fetch daily schedule for resolution check:", e);
        }

        // 3. Match our database markets
        for (const market of activeMarkets) {
            const dbA = normalizeTeamName(market.teamA);
            const dbB = normalizeTeamName(market.teamB);

            // Check if match is currently live
            const matchedLiveEvent = srLiveEvents.find(event => {
                const competitors = event.sport_event?.competitors || [];
                const home = normalizeTeamName(competitors.find(c => c.qualifier === 'home')?.name || '');
                const away = normalizeTeamName(competitors.find(c => c.qualifier === 'away')?.name || '');
                
                const match1 = (home === dbA || home.includes(dbA) || dbA.includes(home)) && 
                               (away === dbB || away.includes(dbB) || dbB.includes(away));
                const match2 = (home === dbB || home.includes(dbB) || dbB.includes(home)) && 
                               (away === dbA || away.includes(dbA) || dbA.includes(away));
                return match1 || match2;
            });

            if (matchedLiveEvent) {
                const status = matchedLiveEvent.sport_event_status || {};
                liveScores[market.id] = {
                    goalsA: status.home_score ?? 0,
                    goalsB: status.away_score ?? 0,
                    elapsed: status.clock?.played ? parseInt(status.clock.played.split(':')[0]) : 0,
                    status: 'LIVE',
                    matchStatus: status.match_status || '1st_half'
                };
                continue;
            }

            // If not live, check if the match was recently concluded today
            const matchedDailyEvent = srDailyEvents.find(event => {
                const competitors = event.sport_event?.competitors || [];
                const home = normalizeTeamName(competitors.find(c => c.qualifier === 'home')?.name || '');
                const away = normalizeTeamName(competitors.find(c => c.qualifier === 'away')?.name || '');
                
                const match1 = (home === dbA || home.includes(dbA) || dbA.includes(home)) && 
                               (away === dbB || away.includes(dbB) || dbB.includes(away));
                const match2 = (home === dbB || home.includes(dbB) || dbB.includes(home)) && 
                               (away === dbA || away.includes(dbA) || dbA.includes(away));
                return match1 || match2;
            });

            if (matchedDailyEvent) {
                const status = matchedDailyEvent.sport_event_status || {};
                
                if (status.status === 'closed' && status.match_status === 'ended') {
                    // Match has finished! Trigger background database payout automatically
                    const homeScore = parseInt(status.home_score);
                    const awayScore = parseInt(status.away_score);

                    liveScores[market.id] = {
                        goalsA: homeScore,
                        goalsB: awayScore,
                        elapsed: 90,
                        status: 'FT'
                    };

                    // Trigger the auto-resolution background process asynchronously
                    try {
                        const todayStr = new Date().toISOString().split('T')[0];
                        fetch(`${request.nextUrl.origin}/api/admin/sportradar-sync`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ date: todayStr })
                        }).catch(e => console.error("Async background sync failed:", e));
                    } catch (e) {
                        console.error("Failed to dispatch async background resolution:", e);
                    }
                } else if (status.status === 'postponed' || status.match_status === 'postponed') {
                    liveScores[market.id] = {
                        goalsA: null,
                        goalsB: null,
                        elapsed: null,
                        status: 'POSTPONED'
                    };
                } else {
                    liveScores[market.id] = {
                        goalsA: null,
                        goalsB: null,
                        elapsed: null,
                        status: 'UPCOMING'
                    };
                }
            } else {
                // Not playing yet or offline
                const matchTime = new Date(market.matchDate).getTime();
                const elapsedMinutes = Math.floor((now - matchTime) / 60000);

                if (elapsedMinutes >= 0 && elapsedMinutes < 120) {
                    liveScores[market.id] = {
                        goalsA: null,
                        goalsB: null,
                        elapsed: null,
                        status: 'OFFLINE'
                    };
                }
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
