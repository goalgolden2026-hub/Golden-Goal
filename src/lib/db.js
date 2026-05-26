import { sql } from '@vercel/postgres';

let isInitialized = false;

export async function getDb() {
    if (!isInitialized) {
        try {
            // UNCOMMENT THIS TO RESET DB: 
            // await sql`DROP TABLE IF EXISTS bets CASCADE`;
            // await sql`DROP TABLE IF EXISTS markets CASCADE`;
            // await sql`DROP TABLE IF EXISTS users CASCADE`;

            await sql`
                CREATE TABLE IF NOT EXISTS users (
                    "walletAddress" TEXT PRIMARY KEY,
                    points INTEGER DEFAULT 0,
                    "betsToday" INTEGER DEFAULT 0,
                    "lastBetDate" DATE DEFAULT CURRENT_DATE
                );
            `;

            await sql`
                CREATE TABLE IF NOT EXISTS markets (
                    id SERIAL PRIMARY KEY,
                    "teamA" TEXT NOT NULL,
                    "teamB" TEXT NOT NULL,
                    "matchDate" TIMESTAMP NOT NULL,
                    "pointsReward" INTEGER DEFAULT 100,
                    status TEXT DEFAULT 'ACTIVE'
                );
            `;

            await sql`
                CREATE TABLE IF NOT EXISTS bets (
                    id SERIAL PRIMARY KEY,
                    "walletAddress" TEXT NOT NULL REFERENCES users("walletAddress"),
                    "marketId" INTEGER NOT NULL REFERENCES markets(id),
                    prediction TEXT NOT NULL,
                    "betType" TEXT DEFAULT 'MAIN',
                    status TEXT DEFAULT 'PENDING',
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            // Add updatedAt column if it doesn't exist (for existing DBs)
            await sql`ALTER TABLE bets ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP;`;

            await sql`
                CREATE TABLE IF NOT EXISTS stakes (
                    id SERIAL PRIMARY KEY,
                    "walletAddress" TEXT NOT NULL REFERENCES users("walletAddress"),
                    tier INTEGER NOT NULL,
                    amount INTEGER NOT NULL,
                    "unlockDate" TIMESTAMP,
                    status TEXT DEFAULT 'ACTIVE',
                    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            await sql`
                CREATE TABLE IF NOT EXISTS treasury_logs (
                    id SERIAL PRIMARY KEY,
                    "walletAddress" TEXT NOT NULL,
                    amount FLOAT NOT NULL,
                    type TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            // Seed initial World Cup markets if none exist
            const { rows } = await sql`SELECT COUNT(*) as count FROM markets;`;
            if (parseInt(rows[0].count) === 0) {
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
            }
            
            isInitialized = true;
        } catch (error) {
            console.error("Database initialization error:", error);
            throw error;
        }
    }
    return sql;
}
