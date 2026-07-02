require('dotenv').config();
const db = require('./src/config/db');

async function setup() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS leads (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(50),
                status VARCHAR(50) DEFAULT 'New',
                source VARCHAR(100),
                notes TEXT,
                assigned_to VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Leads table created successfully.');
    } catch (err) {
        console.error('Error creating leads table:', err);
    } finally {
        process.exit();
    }
}

setup();
