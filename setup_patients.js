require('dotenv').config({ path: './.env' });
const db = require('./src/config/db');

async function setup() {
    try {
        console.log('Setting up customers_patients table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS customers_patients (
                id SERIAL PRIMARY KEY,
                huid VARCHAR(50) UNIQUE,
                full_name VARCHAR(255) NOT NULL,
                phone_number VARCHAR(50),
                email VARCHAR(255),
                dob DATE,
                gender VARCHAR(50),
                blood_group VARCHAR(10),
                weight VARCHAR(20),
                height VARCHAR(20),
                allergies TEXT,
                chronic_conditions TEXT,
                emergency_contact_name VARCHAR(255),
                emergency_contact_phone VARCHAR(50),
                address TEXT,
                last_visited DATE,
                prescription_urls TEXT[] DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('customers_patients table created.');

        await db.query(`
            CREATE TABLE IF NOT EXISTS family_members (
                id SERIAL PRIMARY KEY,
                primary_huid VARCHAR(50) REFERENCES customers_patients(huid) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                relation VARCHAR(50),
                age INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('family_members table created.');

        process.exit(0);
    } catch (err) {
        console.error('Setup failed:', err);
        process.exit(1);
    }
}

setup();
