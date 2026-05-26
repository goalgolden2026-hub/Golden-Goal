require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function migrate() {
    try {
        console.log("Dropping old tables...");
        await sql`DROP TABLE IF EXISTS bets CASCADE`;
        await sql`DROP TABLE IF EXISTS markets CASCADE`;
        await sql`DROP TABLE IF EXISTS users CASCADE`;

        console.log("Creating new users table...");
        await sql`
            CREATE TABLE users (
                "walletAddress" TEXT PRIMARY KEY,
                points INTEGER DEFAULT 0,
                "betsToday" INTEGER DEFAULT 0,
                "lastBetDate" DATE DEFAULT CURRENT_DATE
            );
        `;

        console.log("Creating new markets table...");
        await sql`
            CREATE TABLE markets (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                "endDate" TEXT NOT NULL,
                "pointsReward" INTEGER DEFAULT 100,
                "yesPercent" INTEGER DEFAULT 50,
                "noPercent" INTEGER DEFAULT 50,
                status TEXT DEFAULT 'ACTIVE'
            );
        `;

        console.log("Creating new bets table...");
        await sql`
            CREATE TABLE bets (
                id SERIAL PRIMARY KEY,
                "walletAddress" TEXT NOT NULL REFERENCES users("walletAddress"),
                "marketId" INTEGER NOT NULL REFERENCES markets(id),
                prediction TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        console.log("Seeding initial markets...");
        await sql`
            INSERT INTO markets (title, category, "endDate", "pointsReward", "yesPercent", "noPercent")
            VALUES 
            ('Will Real Madrid win the Champions League 2026?', 'Sports', '2026-05-30', 100, 65, 35),
            ('Will Bitcoin hit $100k before December?', 'Crypto', '2026-12-01', 100, 82, 18),
            ('Will Donald Trump win the 2028 Election?', 'Politics', '2028-11-07', 100, 55, 45)
        `;

        console.log("Migration successful!");
        process.exit(0);
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    }
}

migrate();
