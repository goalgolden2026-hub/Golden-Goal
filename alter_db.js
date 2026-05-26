const { db } = require('@vercel/postgres');

async function alter() {
    try {
        const client = await db.connect();
        
        // Add predictionType and status columns if they don't exist
        await client.query(`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS "predictionType" TEXT DEFAULT 'MAIN';`);
        await client.query(`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'PENDING';`);
        
        console.log("Database altered successfully.");
        process.exit(0);
    } catch (e) {
        console.error("Error altering database:", e);
        process.exit(1);
    }
}
alter();
