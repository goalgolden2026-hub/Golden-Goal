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
                    "socialPoints" INTEGER DEFAULT 0,
                    "freeBoxesOpenedToday" INTEGER DEFAULT 0
                );
            `;

            await sql`
                CREATE TABLE IF NOT EXISTS markets (
                    id SERIAL PRIMARY KEY,
                    "teamA" TEXT NOT NULL,
                    "teamB" TEXT NOT NULL,
                    "matchDate" TIMESTAMP NOT NULL,
                    "pointsReward" INTEGER DEFAULT 100,
                    status TEXT DEFAULT 'ACTIVE',
                    sport TEXT DEFAULT 'FOOTBALL'
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

            // Migration: Add sport column to markets table
            await sql`ALTER TABLE markets ADD COLUMN IF NOT EXISTS "sport" TEXT DEFAULT 'FOOTBALL';`;

            // Migration: Add pointsReward to predictions table
            await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS "pointsReward" INTEGER DEFAULT 100;`;

            // Migration: Add performance indexes to predictions and locks tables
            await sql`CREATE INDEX IF NOT EXISTS idx_predictions_wallet ON predictions("walletAddress");`;
            await sql`CREATE INDEX IF NOT EXISTS idx_predictions_market ON predictions("marketId");`;
            await sql`CREATE INDEX IF NOT EXISTS idx_locks_wallet ON locks("walletAddress");`;

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
                CREATE TABLE IF NOT EXISTS live_scores_cache (
                    key TEXT PRIMARY KEY,
                    data JSONB,
                    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            await sql`
                CREATE TABLE IF NOT EXISTS social_raffle_winners (
                    id SERIAL PRIMARY KEY,
                    "walletAddress" TEXT NOT NULL,
                    "raffleNumber" INTEGER UNIQUE,
                    "prizeAmount" INTEGER DEFAULT 0,
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
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "freeBoxesOpenedToday" INTEGER DEFAULT 0;`;

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

            // Seed VNL Volleyball matches if none exist
            const { rows: volleyballCountRes } = await sql`SELECT COUNT(*) as count FROM markets WHERE sport = 'VOLLEYBALL';`;
            if (parseInt(volleyballCountRes[0].count) === 0) {
                console.log("Seeding VNL Volleyball matches...");
                const volleyballMatches = [
                    { teamA: 'Turkey', teamB: 'Belgium', date: '2026-06-17 19:30:00+03' },
                    { teamA: 'Turkey', teamB: 'France', date: '2026-06-18 19:30:00+03' },
                    { teamA: 'Turkey', teamB: 'Germany', date: '2026-06-20 19:30:00+03' },
                    { teamA: 'Turkey', teamB: 'China', date: '2026-06-21 19:30:00+03' },
                    { teamA: 'China', teamB: 'Turkey', date: '2026-06-24 14:00:00+03' },
                    { teamA: 'Poland', teamB: 'Turkey', date: '2026-06-25 21:00:00+03' },
                    { teamA: 'USA', teamB: 'Czechia', date: '2026-06-18 16:00:00+03' },
                    { teamA: 'Serbia', teamB: 'Italy', date: '2026-06-18 20:00:00+03' },
                    { teamA: 'Belgium', teamB: 'Brazil', date: '2026-06-18 16:00:00+03' },
                    { teamA: 'France', teamB: 'China', date: '2026-06-19 16:00:00+03' },
                    { teamA: 'Belgium', teamB: 'Germany', date: '2026-06-19 19:30:00+03' }
                ];
                for (const match of volleyballMatches) {
                    let oddsObj = null;
                    if (match.teamA === 'Turkey' && match.teamB === 'Belgium') {
                        oddsObj = {
                            "MAIN": { "Turkey": 1.10, "Belgium": 6.50 },
                            "CORRECT_SCORE": { "3-0": 1.70, "3-1": 3.10, "3-2": 5.20, "2-3": 11.00, "1-3": 15.00, "0-3": 23.00 },
                            "TOTAL_POINTS": { "Under 180.5": 1.45, "Over 180.5": 2.55 },
                            "FIRST_SET": { "Turkey": 1.18, "Belgium": 4.80 },
                            "FIFTH_SET": { "Yes": 5.20, "No": 1.13 },
                            "EXTRA_POINTS": { "Yes": 3.20, "No": 1.30 }
                        };
                    } else if (match.teamA === 'Turkey' && match.teamB === 'France') {
                        oddsObj = {
                            "MAIN": { "Turkey": 1.05, "France": 9.00 },
                            "CORRECT_SCORE": { "3-0": 1.50, "3-1": 3.20, "3-2": 6.00, "2-3": 15.00, "1-3": 23.00, "0-3": 35.00 },
                            "TOTAL_POINTS": { "Under 180.5": 1.35, "Over 180.5": 2.95 },
                            "FIRST_SET": { "Turkey": 1.12, "France": 6.00 },
                            "FIFTH_SET": { "Yes": 6.00, "No": 1.10 },
                            "EXTRA_POINTS": { "Yes": 3.50, "No": 1.25 }
                        };
                    } else if (match.teamA === 'Turkey' && match.teamB === 'Germany') {
                        oddsObj = {
                            "MAIN": { "Turkey": 1.15, "Germany": 5.00 },
                            "CORRECT_SCORE": { "3-0": 1.95, "3-1": 3.05, "3-2": 4.80, "2-3": 9.50, "1-3": 13.00, "0-3": 19.00 },
                            "TOTAL_POINTS": { "Under 180.5": 1.55, "Over 180.5": 2.30 },
                            "FIRST_SET": { "Turkey": 1.25, "Germany": 3.80 },
                            "FIFTH_SET": { "Yes": 4.80, "No": 1.15 },
                            "EXTRA_POINTS": { "Yes": 3.00, "No": 1.33 }
                        };
                    } else if (match.teamA === 'Turkey' && match.teamB === 'China') {
                        oddsObj = {
                            "MAIN": { "Turkey": 1.80, "China": 2.00 },
                            "CORRECT_SCORE": { "3-0": 4.20, "3-1": 3.80, "3-2": 4.20, "2-3": 4.50, "1-3": 4.00, "0-3": 4.80 },
                            "TOTAL_POINTS": { "Under 180.5": 1.90, "Over 180.5": 1.80 },
                            "FIRST_SET": { "Turkey": 1.80, "China": 1.95 },
                            "FIFTH_SET": { "Yes": 3.20, "No": 1.30 },
                            "EXTRA_POINTS": { "Yes": 2.70, "No": 1.40 }
                        };
                    } else if (match.teamA === 'China' && match.teamB === 'Turkey') {
                        oddsObj = {
                            "MAIN": { "China": 2.00, "Turkey": 1.80 },
                            "CORRECT_SCORE": { "3-0": 4.80, "3-1": 4.00, "3-2": 4.50, "2-3": 4.20, "1-3": 3.80, "0-3": 4.20 },
                            "TOTAL_POINTS": { "Under 180.5": 1.90, "Over 180.5": 1.80 },
                            "FIRST_SET": { "China": 1.95, "Turkey": 1.80 },
                            "FIFTH_SET": { "Yes": 3.20, "No": 1.30 },
                            "EXTRA_POINTS": { "Yes": 2.70, "No": 1.40 }
                        };
                    } else if (match.teamA === 'Poland' && match.teamB === 'Turkey') {
                        oddsObj = {
                            "MAIN": { "Poland": 2.20, "Turkey": 1.65 },
                            "CORRECT_SCORE": { "3-0": 5.20, "3-1": 4.50, "3-2": 4.80, "2-3": 4.00, "1-3": 3.65, "0-3": 3.90 },
                            "TOTAL_POINTS": { "Under 180.5": 1.85, "Over 180.5": 1.85 },
                            "FIRST_SET": { "Poland": 2.10, "Turkey": 1.68 },
                            "FIFTH_SET": { "Yes": 3.20, "No": 1.30 },
                            "EXTRA_POINTS": { "Yes": 2.70, "No": 1.40 }
                        };
                    } else if (match.teamA === 'USA' && match.teamB === 'Czechia') {
                        oddsObj = {
                            "MAIN": { "USA": 1.05, "Czechia": 9.00 },
                            "CORRECT_SCORE": { "3-0": 1.50, "3-1": 3.20, "3-2": 6.00, "2-3": 15.00, "1-3": 23.00, "0-3": 35.00 },
                            "TOTAL_POINTS": { "Under 180.5": 1.35, "Over 180.5": 2.95 },
                            "FIRST_SET": { "USA": 1.12, "Czechia": 6.00 },
                            "FIFTH_SET": { "Yes": 6.00, "No": 1.10 },
                            "EXTRA_POINTS": { "Yes": 3.50, "No": 1.25 }
                        };
                    } else if (match.teamA === 'Serbia' && match.teamB === 'Italy') {
                        oddsObj = {
                            "MAIN": { "Serbia": 2.50, "Italy": 1.50 },
                            "CORRECT_SCORE": { "3-0": 7.50, "3-1": 5.80, "3-2": 5.20, "2-3": 4.50, "1-3": 3.40, "0-3": 3.80 },
                            "TOTAL_POINTS": { "Under 180.5": 1.85, "Over 180.5": 1.85 },
                            "FIRST_SET": { "Serbia": 2.30, "Italy": 1.55 },
                            "FIFTH_SET": { "Yes": 3.20, "No": 1.30 },
                            "EXTRA_POINTS": { "Yes": 2.70, "No": 1.40 }
                        };
                    } else if (match.teamA === 'Belgium' && match.teamB === 'Brazil') {
                        oddsObj = {
                            "MAIN": { "Belgium": 5.50, "Brazil": 1.12 },
                            "CORRECT_SCORE": { "3-0": 21.00, "3-1": 14.00, "3-2": 10.00, "2-3": 5.00, "1-3": 3.05, "0-3": 1.85 },
                            "TOTAL_POINTS": { "Under 180.5": 1.50, "Over 180.5": 2.40 },
                            "FIRST_SET": { "Belgium": 4.20, "Brazil": 1.20 },
                            "FIFTH_SET": { "Yes": 5.00, "No": 1.14 },
                            "EXTRA_POINTS": { "Yes": 3.10, "No": 1.32 }
                        };
                    } else if (match.teamA === 'France' && match.teamB === 'China') {
                        oddsObj = {
                            "MAIN": { "France": 7.00, "China": 1.08 },
                            "CORRECT_SCORE": { "3-0": 25.00, "3-1": 16.00, "3-2": 11.00, "2-3": 5.50, "1-3": 3.15, "0-3": 1.65 },
                            "TOTAL_POINTS": { "Under 180.5": 1.40, "Over 180.5": 2.70 },
                            "FIRST_SET": { "France": 5.00, "China": 1.15 },
                            "FIFTH_SET": { "Yes": 5.50, "No": 1.12 },
                            "EXTRA_POINTS": { "Yes": 3.30, "No": 1.28 }
                        };
                    } else if (match.teamA === 'Belgium' && match.teamB === 'Germany') {
                        oddsObj = {
                            "MAIN": { "Belgium": 2.80, "Germany": 1.40 },
                            "CORRECT_SCORE": { "3-0": 9.00, "3-1": 6.20, "3-2": 5.50, "2-3": 4.60, "1-3": 3.10, "0-3": 3.40 },
                            "TOTAL_POINTS": { "Under 180.5": 1.85, "Over 180.5": 1.85 },
                            "FIRST_SET": { "Belgium": 2.50, "Germany": 1.48 },
                            "FIFTH_SET": { "Yes": 3.20, "No": 1.30 },
                            "EXTRA_POINTS": { "Yes": 2.70, "No": 1.40 }
                        };
                    } else {
                        oddsObj = {
                            "MAIN": { [match.teamA]: 1.85, [match.teamB]: 1.85 },
                            "CORRECT_SCORE": { "3-0": 4.50, "3-1": 3.80, "3-2": 4.20, "2-3": 4.20, "1-3": 3.80, "0-3": 4.50 },
                            "TOTAL_POINTS": { "Under 180.5": 1.85, "Over 180.5": 1.85 },
                            "FIRST_SET": { [match.teamA]: 1.85, [match.teamB]: 1.85 },
                            "FIFTH_SET": { "Yes": 3.20, "No": 1.30 },
                            "EXTRA_POINTS": { "Yes": 2.80, "No": 1.38 }
                        };
                    }
                    await sql`
                        INSERT INTO markets ("teamA", "teamB", "matchDate", "pointsReward", "sport", "odds") 
                        VALUES (${match.teamA}, ${match.teamB}, ${match.date}, 100, 'VOLLEYBALL', ${JSON.stringify(oddsObj)})
                    `;
                }
                console.log("Volleyball seeding completed successfully.");
            }
            
            isInitialized = true;
        } catch (error) {
            console.error("Database initialization error:", error);
            throw error;
        }
    }
    return sql;
}

