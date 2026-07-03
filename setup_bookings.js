require('dotenv').config({ path: './.env' });
const db = require('./src/config/db');

async function setup() {
    try {
        console.log('Setting up bookings table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                patient_name VARCHAR(255) NOT NULL,
                huid VARCHAR(50),
                phone_number VARCHAR(50),
                details TEXT,
                booking_date DATE,
                booking_time VARCHAR(50),
                status VARCHAR(50) DEFAULT 'Pending',
                agent_name VARCHAR(255),
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('bookings table created.');

        process.exit(0);
    } catch (err) {
        console.error('Setup failed:', err);
        process.exit(1);
    }
}

setup();
