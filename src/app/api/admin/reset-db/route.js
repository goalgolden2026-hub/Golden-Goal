import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
    try {
        await sql`DROP TABLE IF EXISTS bets CASCADE`;
        await sql`DROP TABLE IF EXISTS markets CASCADE`;
        await sql`DROP TABLE IF EXISTS users CASCADE`;

        await sql`
            CREATE TABLE users (
                "walletAddress" TEXT PRIMARY KEY,
                points INTEGER DEFAULT 0,
                "betsToday" INTEGER DEFAULT 0,
                "lastBetDate" DATE DEFAULT CURRENT_DATE
            );
        `;

        await sql`
            CREATE TABLE markets (
                id SERIAL PRIMARY KEY,
                "teamA" TEXT NOT NULL,
                "teamB" TEXT NOT NULL,
                "matchDate" TIMESTAMP NOT NULL,
                "pointsReward" INTEGER DEFAULT 100,
                status TEXT DEFAULT 'ACTIVE'
            );
        `;

        await sql`
            CREATE TABLE bets (
                id SERIAL PRIMARY KEY,
                "walletAddress" TEXT NOT NULL REFERENCES users("walletAddress"),
                "marketId" INTEGER NOT NULL REFERENCES markets(id),
                prediction TEXT NOT NULL,
                "betType" TEXT DEFAULT 'MAIN',
                status TEXT DEFAULT 'PENDING',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await sql`
            INSERT INTO markets ("teamA", "teamB", "matchDate", "pointsReward")
            VALUES 
            ('Turkey', 'Australia', '2026-06-11 16:00:00', 100),
            ('Brazil', 'Serbia', '2026-06-11 19:00:00', 100),
            ('USA', 'Wales', '2026-06-12 16:00:00', 100),
            ('Argentina', 'Saudi Arabia', '2026-06-12 19:00:00', 100),
            ('France', 'Denmark', '2026-06-13 16:00:00', 100),
            ('England', 'Iran', '2026-06-13 19:00:00', 100),
            ('Spain', 'Croatia', '2026-06-14 16:00:00', 100),
            ('Germany', 'Japan', '2026-06-14 19:00:00', 100),
            ('Portugal', 'Ghana', '2026-06-15 16:00:00', 100),
            ('Netherlands', 'Senegal', '2026-06-15 19:00:00', 100)
        `;

        return NextResponse.json({ success: true, message: "Database reset and seeded." });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
