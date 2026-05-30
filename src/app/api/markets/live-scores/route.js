import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function normalizeTeamName(name) {
    if (!name) return '';
    return name
        .toLowerCase()
        // Remove diacritics / accents (e.g. Curaçao -> Curacao, España -> Espana, Türkiye -> Turkiye)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        // Common synonym maps
        .replace(/\b(united states|usa|us)\b/g, 'usa')
        .replace(/\b(korea republic|south korea|korea)\b/g, 'south korea')
        .replace(/\b(korea dpr|north korea)\b/g, 'north korea')
        .replace(/\b(cote d'ivoire|ivory coast)\b/g, 'ivory coast')
        .replace(/\b(turkiye|turkey)\b/g, 'turkey')
        .replace(/[^a-z0-9]/g, ' ') // Strip non-alphanumeric
        .trim();
}

// Simple in-memory cache to stay under API-Football daily rate limits (60 seconds cache)
let scoreCache = null;
let lastCacheTime = 0;
const CACHE_TTL = 60 * 1000; 

export async function GET() {
    try {
        const sql = await getDb();
        const { rows: activeMarkets } = await sql`
            SELECT id, "teamA", "teamB", "matchDate", status 
            FROM markets 
            WHERE status = 'ACTIVE'
        `;

        const now = Date.now();
        const liveScores = {};

        // If we have an API Key, try fetching real scores from API-Football
        const apiKey = process.env.FOOTBALL_API_KEY;
        
        if (apiKey && apiKey.trim().length > 0) {
            // Check cache validity
            if (scoreCache && (now - lastCacheTime < CACHE_TTL)) {
                console.log("Serving live scores from server-side cache...");
                return NextResponse.json({ success: true, scores: scoreCache }, { status: 200 });
            }

            try {
                console.log("Fetching live scores from API-Football...");
                const response = await fetch('https://v3.football.api-sports.io/fixtures?live=all', {
                    headers: {
                        'x-apisports-key': apiKey,
                        'x-rapidapi-key': apiKey
                    },
                    next: { revalidate: 60 } // Vercel cache fallback
                });
                
                const apiData = await response.json();
                
                if (apiData && apiData.response) {
                    const apiFixtures = apiData.response;
                    
                    // Match API-Football fixtures to our active database markets
                    for (const market of activeMarkets) {
                        const matchDate = new Date(market.matchDate);
                        const matchTime = matchDate.getTime();
                        
                        // Look for a fixture matching our team names (using robust diacritic normalization)
                        const matchingFixture = apiFixtures.find(f => {
                            const home = normalizeTeamName(f.teams.home.name);
                            const away = normalizeTeamName(f.teams.away.name);
                            const a = normalizeTeamName(market.teamA);
                            const b = normalizeTeamName(market.teamB);
                            
                            const matchA = home.includes(a) || a.includes(home);
                            const matchB = away.includes(b) || b.includes(away);
                            
                            return matchA && matchB;
                        });
                        
                        if (matchingFixture) {
                            liveScores[market.id] = {
                                goalsA: matchingFixture.goals.home ?? 0,
                                goalsB: matchingFixture.goals.away ?? 0,
                                elapsed: matchingFixture.fixture.status.elapsed ?? 0,
                                status: matchingFixture.fixture.status.short // '1H', '2H', 'HT', 'FT', etc.
                            };
                        } else {
                            // If match has started but is not found in the live API feed -> Set as OFFLINE
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
                    
                    // Update cache
                    scoreCache = liveScores;
                    lastCacheTime = now;
                    return NextResponse.json({ success: true, scores: liveScores }, { status: 200 });
                }
            } catch (apiError) {
                console.error("API-Football request failed, setting playing matches as OFFLINE:", apiError);
            }
        }

        // Fallback: If no API Key is set or an API request fails, set all currently playing matches as OFFLINE.
        // This ensures the site displays honest "offline / unavailable" statuses rather than generating fake simulation scores.
        for (const market of activeMarkets) {
            const matchTime = new Date(market.matchDate).getTime();
            const elapsedMinutes = Math.floor((now - matchTime) / 60000);
            
            // If the match is currently playing (elapsed between 0 and 120 minutes)
            if (elapsedMinutes >= 0 && elapsedMinutes < 120) {
                liveScores[market.id] = {
                    goalsA: null,
                    goalsB: null,
                    elapsed: null,
                    status: 'OFFLINE'
                };
            }
        }

        return NextResponse.json({ success: true, scores: liveScores }, { status: 200 });
    } catch (error) {
        console.error("GET /api/markets/live-scores error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch live scores" }, { status: 500 });
    }
}
