const fs = require('fs');
const path = require('path');

// Manually parse .env.local if dotenv is not loaded or missing
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            process.env[key] = value;
        }
    });
    console.log("Successfully loaded .env.local manually.");
}

const { db } = require('@vercel/postgres');

const adminWallets = [
    "2iF2q7hjEqEe8o6PTdJnYRYZUCeaMDjD35tSrKbu5R8K",
    "HMsWAhRC9wom6JVBpuo2gjAGp7Sb59FEyMraLpC4YXGc",
    "5taHGRqDNFGRMGUZRCgdF5bGikwqZ7smxsH5YF5WPyc7",
    "62dBE6cVZmG728DkbZssDjrJm6Dn1as9Me2dMCh6HMPN"
];

async function addPoints() {
    try {
        const client = await db.connect();
        console.log("Connected to PostgreSQL database.");

        for (const wallet of adminWallets) {
            console.log(`Adding 250 XP to wallet: ${wallet}`);
            const res = await client.query(`
                INSERT INTO users ("walletAddress", points) 
                VALUES ($1, 250) 
                ON CONFLICT ("walletAddress") 
                DO UPDATE SET points = COALESCE(users.points, 0) + 250
                RETURNING "walletAddress", points
            `, [wallet]);
            
            console.log(`Result: wallet ${res.rows[0].walletAddress} now has ${res.rows[0].points} XP.`);
        }
        
        console.log("All whitelisted admin wallets successfully credited with 250 XP!");
        process.exit(0);
    } catch (e) {
        console.error("Error executing script:", e);
        process.exit(1);
    }
}

addPoints();
