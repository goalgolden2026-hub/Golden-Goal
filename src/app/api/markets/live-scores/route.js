import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

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
                        
                        // Look for a fixture matching our team names
                        const matchingFixture = apiFixtures.find(f => {
                            const homeName = f.teams.home.name.toLowerCase();
                            const awayName = f.teams.away.name.toLowerCase();
                            const teamA = market.teamA.toLowerCase();
                            const teamB = market.teamB.toLowerCase();
                            
                            // Check for direct name match or sub-string match (handling translation variations like Turkey / Türkiye)
                            return (homeName.includes(teamA) || teamA.includes(homeName) || homeName.includes('turk') && teamA.includes('turk')) &&
                                   (awayName.includes(teamB) || teamB.includes(awayName));
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
