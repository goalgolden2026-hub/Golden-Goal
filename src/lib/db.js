import { sql } from '@vercel/postgres';

let isInitialized = false;

export async function getDb() {
    if (!isInitialized) {
        try {
            // UNCOMMENT THIS TO RESET DB: 
            // await sql`DROP TABLE IF EXISTS predictions CASCADE`;
            // await sql`DROP TABLE IF EXISTS markets CASCADE`;
            // await sql`DROP TABLE IF EXISTS users CASCADE`;

            // --- DATABASE MIGRATIONS START ---
            // 1. Rename 'bets' table to 'predictions' if it exists
            try {
                await sql`ALTER TABLE IF EXISTS bets RENAME TO predictions;`;
                console.log("Migration: Renamed 'bets' table to 'predictions'");
            } catch (e) {
                // Table might already be renamed or not exist
            }

            // 1b. Rename 'stakes' table to 'locks' if it exists
            try {
                await sql`ALTER TABLE IF EXISTS stakes RENAME TO locks;`;
                console.log("Migration: Renamed 'stakes' table to 'locks'");
            } catch (e) {
                // Table might already be renamed or not exist
            }

            // 2. Rename columns in predictions table (formerly bets)
            try {
                await sql`ALTER TABLE IF EXISTS predictions RENAME COLUMN "betType" TO "predictionType";`;
                console.log("Migration: Renamed column 'betType' to 'predictionType' in predictions");
            } catch (e) {
                // Column might already be renamed or not exist
            }

            // 3. Rename columns in users table
            const userColumnsToRename = [
                { old: 'betsToday', new: 'predictionsToday' },
                { old: 'lastBetDate', new: 'lastPredictionDate' },
                { old: 'lastFreeSpinDate', new: 'lastFreeBoxDate' },
                { old: 'spinBonusBets', new: 'bonusPredictions' }
            ];

            for (const col of userColumnsToRename) {
                try {
                    // We check if the old column exists before renaming
                    const checkCol = await sql`
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = 'users' AND column_name = ${col.old}
                    `;
                    if (checkCol.rowCount > 0) {
                        await sql.query(`ALTER TABLE users RENAME COLUMN "${col.old}" TO "${col.new}"`);
                        console.log(`Migration: Renamed user column '${col.old}' to '${col.new}'`);
                    }
                } catch (e) {
                    console.error(`Migration error renaming ${col.old}:`, e);
                }
            }
            // --- DATABASE MIGRATIONS END ---

            await sql`
                CREATE TABLE IF NOT EXISTS users (
                    "walletAddress" TEXT PRIMARY KEY,
                    points INTEGER DEFAULT 0,
                    "predictionsToday" INTEGER DEFAULT 0,
                    "lastPredictionDate" DATE DEFAULT CURRENT_DATE,
                    "referralCode" TEXT UNIQUE,
                    "referredBy" TEXT,
                    "referralPoints" INTEGER DEFAULT 0,
                    "lastFreeBoxDate" DATE,
                    "bonusPredictions" INTEGER DEFAULT 0,
                    "twitterTaskStatus" BOOLEAN DEFAULT false,
                    "socialPoints" INTEGER DEFAULT 0
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
                CREATE TABLE IF NOT EXISTS predictions (
                    id SERIAL PRIMARY KEY,
                    "walletAddress" TEXT NOT NULL REFERENCES users("walletAddress"),
                    "marketId" INTEGER NOT NULL REFERENCES markets(id),
                    prediction TEXT NOT NULL,
                    "predictionType" TEXT DEFAULT 'MAIN',
                    status TEXT DEFAULT 'PENDING',
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP
                );
            `;

            await sql`
                CREATE TABLE IF NOT EXISTS locks (
                    id SERIAL PRIMARY KEY,
                    "walletAddress" TEXT NOT NULL REFERENCES users("walletAddress"),
                    tier INTEGER NOT NULL,
                    amount INTEGER NOT NULL,
                    "unlockDate" TIMESTAMP,
                    status TEXT DEFAULT 'ACTIVE',
                    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            // Migration: Add txSignature to locks table
            await sql`ALTER TABLE locks ADD COLUMN IF NOT EXISTS "txSignature" TEXT UNIQUE;`;
            
            // Migration: Add resolvedMarkets to markets table
            await sql`ALTER TABLE markets ADD COLUMN IF NOT EXISTS "resolvedMarkets" TEXT;`;

            await sql`
                CREATE TABLE IF NOT EXISTS treasury_logs (
                    id SERIAL PRIMARY KEY,
                    "walletAddress" TEXT NOT NULL,
                    amount FLOAT NOT NULL,
                    type TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            await sql`
                CREATE TABLE IF NOT EXISTS referrals (
                    id SERIAL PRIMARY KEY,
                    "referrerCode" TEXT NOT NULL,
                    "referredWallet" TEXT NOT NULL,
                    "ipAddress" TEXT,
                    status TEXT DEFAULT 'PENDING',
                    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            await sql`
                CREATE TABLE IF NOT EXISTS social_tasks (
                    id SERIAL PRIMARY KEY,
                    "walletAddress" TEXT NOT NULL,
                    "taskType" TEXT NOT NULL,
                    "url" TEXT NOT NULL,
                    status TEXT DEFAULT 'COMPLETED',
                    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            // ADD MISSING COLUMNS FOR EXISTING DB (safety checks using the new column names)
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "referralCode" TEXT UNIQUE;`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "referredBy" TEXT;`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "referralPoints" INTEGER DEFAULT 0;`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastFreeBoxDate" DATE;`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "bonusPredictions" INTEGER DEFAULT 0;`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "twitterTaskStatus" BOOLEAN DEFAULT false;`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "socialPoints" INTEGER DEFAULT 0;`;

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

