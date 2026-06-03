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
            
            // Migration: Add resolvedOutcomes to markets table
            await sql`ALTER TABLE markets ADD COLUMN IF NOT EXISTS "resolvedOutcomes" TEXT;`;
            
            // Migration: Add scoreA and scoreB to markets table
            await sql`ALTER TABLE markets ADD COLUMN IF NOT EXISTS "scoreA" INTEGER;`;
            await sql`ALTER TABLE markets ADD COLUMN IF NOT EXISTS "scoreB" INTEGER;`;

            // Migration: Add odds JSONB to markets table
            await sql`ALTER TABLE markets ADD COLUMN IF NOT EXISTS "odds" JSONB;`;

            // Migration: Add pointsReward to predictions table
            await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS "pointsReward" INTEGER DEFAULT 100;`;

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
                const rawMatches = `Group A
11 June	Mexico - South Africa	22:00
12 June	South Korea - Czechia	05:00
18 June	Czechia - South Africa	19:00
19 June	Mexico - South Korea	04:00
25 June	South Africa - South Korea	04:00
25 June	Czechia - Mexico	04:00

Group B
12 June	Canada - Bosnia and Herzegovina	22:00
13 June	Qatar - Switzerland	22:00
18 June	Switzerland - Bosnia and Herzegovina	22:00
19 June	Canada - Qatar	01:00
24 June	Switzerland - Canada	22:00
24 June	Bosnia and Herzegovina - Qatar	22:00

Group C
14 June	Brazil - Morocco	01:00
14 June	Haiti - Scotland	04:00
20 June	Scotland - Morocco	01:00
20 June	Brazil - Haiti	03:30
25 June	Morocco - Haiti	01:00
25 June	Scotland - Brazil	01:00

Group D
13 June	USA - Paraguay	04:00
13 June	Australia - Turkey	07:00
19 June	USA - Australia	22:00
20 June	Turkey - Paraguay	06:00
26 June	Turkey - USA	05:00
26 June	Paraguay - Australia	05:00

Group E
14 June	Germany - Curacao	20:00
15 June	Ivory Coast - Ecuador	02:00
20 June	Germany - Ivory Coast	23:00
21 June	Ecuador - Curacao	03:00
25 June	Curacao - Ivory Coast	23:00
25 June	Ecuador - Germany	23:00

Group F
14 June	Netherlands - Japan	23:00
15 June	Sweden - Tunisia	05:00
20 June	Netherlands - Sweden	20:00
20 June	Tunisia - Japan	07:00
26 June	Tunisia - Netherlands	02:00
26 June	Japan - Sweden	02:00

Group G
15 June	Belgium - Egypt	22:00
16 June	Iran - New Zealand	04:00
21 June	Belgium - Iran	22:00
22 June	New Zealand - Egypt	04:00
27 June	New Zealand - Belgium	06:00
27 June	Egypt - Iran	06:00

Group H
15 June	Spain - Cape Verde	19:00
16 June	Saudi Arabia - Uruguay	01:00
21 June	Spain - Saudi Arabia	19:00
22 June	Uruguay - Cape Verde	01:00
27 June	Cape Verde - Saudi Arabia	03:00
27 June	Uruguay - Spain	03:00

Group I
16 June	France - Senegal	22:00
17 June	Iraq - Norway	01:00
23 June	France - Iraq	00:00
23 June	Norway - Senegal	03:00
26 June	Norway - France	22:00
26 June	Senegal - Iraq	22:00

Group J
17 June	Argentina - Algeria	04:00
17 June	Austria - Jordan	07:00
22 June	Argentina - Austria	20:00
23 June	Jordan - Algeria	06:00
28 June	Algeria - Austria	05:00
28 June	Jordan - Argentina	05:00

Group K
17 June	Portugal - DR Congo	20:00
18 June	Uzbekistan - Colombia	05:00
23 June	Portugal - Uzbekistan	20:00
24 June	Colombia - DR Congo	05:00
28 June	Colombia - Portugal	02:30
28 June	DR Congo - Uzbekistan	02:30

Group L
17 June	England - Croatia	23:00
18 June	Ghana - Panama	02:00
23 June	England - Ghana	23:00
24 June	Panama - Croatia	02:00
28 June	Panama - England	00:00
28 June	Croatia - Ghana	00:00`;

                const lines = rawMatches.split('\n');
                for (const line of lines) {
                    if (!line.trim() || line.startsWith('Group')) continue;
                    let parts = line.split('\t');
                    if (parts.length < 3) {
                        parts = line.split(/\s{2,}|\t/);
                    }
                    if (parts.length >= 3) {
                        let datePart = parts[0];
                        let teamsPart = parts[1];
                        let timePart = parts[2];
                        const [day] = datePart.split(' ');
                        const month = '06'; 
                        const paddedDay = day.padStart(2, '0');
                        const [teamA, teamB] = teamsPart.split(' - ');
                        const matchDate = `2026-${month}-${paddedDay} ${timePart}:00+03`;
                        await sql`INSERT INTO markets ("teamA", "teamB", "matchDate", "pointsReward") VALUES (${teamA}, ${teamB}, ${matchDate}, 100)`;
                    }
                }
            }
            
            isInitialized = true;
        } catch (error) {
            console.error("Database initialization error:", error);
            throw error;
        }
    }
    return sql;
}

