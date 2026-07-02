require('dotenv').config({ path: './.env' });
const db = require('./src/config/db');

async function migrate() {
    try {
        console.log('Adding medical fields to customers_patients table...');
        await db.query(`
            ALTER TABLE customers_patients 
            ADD COLUMN IF NOT EXISTS gender VARCHAR(50),
            ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10),
            ADD COLUMN IF NOT EXISTS weight VARCHAR(20),
            ADD COLUMN IF NOT EXISTS height VARCHAR(20),
            ADD COLUMN IF NOT EXISTS allergies TEXT,
            ADD COLUMN IF NOT EXISTS chronic_conditions TEXT,
            ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50),
            ADD COLUMN IF NOT EXISTS address TEXT;
        `);
        console.log('Medical fields added successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
