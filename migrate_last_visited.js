require('dotenv').config({ path: './.env' });
const db = require('./src/config/db');

async function migrate() {
    try {
        console.log('Adding last_visited to customers_patients table...');
        await db.query(`ALTER TABLE customers_patients ADD COLUMN IF NOT EXISTS last_visited DATE;`);
        
        console.log('Migration successful.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
