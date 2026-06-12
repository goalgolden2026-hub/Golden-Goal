import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '15e24fe1f1msh75f445d3e3d398dp1968d3jsn73f855695703';
const SPORT_API_HOST = 'sportapi7.p.rapidapi.com';

export async function GET() {
    try {
        const targetDate = '2026-06-12';
        const url = `https://${SPORT_API_HOST}/api/v1/sport/football/scheduled-events/${targetDate}`;
        
        console.log(`[DIAGNOSTIC] Fetching: ${url}`);
        console.log(`[DIAGNOSTIC] RAPIDAPI_KEY exists: ${!!process.env.RAPIDAPI_KEY}, length: ${process.env.RAPIDAPI_KEY?.length}`);
        
        const response = await fetch(url, {
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': SPORT_API_HOST
            },
            cache: 'no-store'
        });
        
        if (response.ok) {
            const data = await response.json();
            const event = data.events?.find(e => e.id === 15186836);
            return NextResponse.json({
                success: true,
                status: response.status,
                message: "Fetch succeeded",
                event_found: !!event,
                event_details: event ? {
                    id: event.id,
                    status: event.status,
                    homeScore: event.homeScore,
                    awayScore: event.awayScore,
                    time: event.time
                } : null
            });
        } else {
            const text = await response.text().catch(e => e.message);
            return NextResponse.json({
                success: false,
                status: response.status,
                statusText: response.statusText,
                body: text
            });
        }
    } catch (err) {
        return NextResponse.json({
            success: false,
            error: err.message,
            stack: err.stack
        });
    }
}
