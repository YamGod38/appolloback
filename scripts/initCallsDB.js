require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const poolConfig = process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
} : {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
};

const pool = new Pool(poolConfig);

async function initCallsDB() {
    try {
        console.log('Connecting to database...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS missed_calls (
                id SERIAL PRIMARY KEY,
                phone VARCHAR(50) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'Pending'
            );
        `);
        console.log('missed_calls table ready.');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS scheduled_calls (
                id SERIAL PRIMARY KEY,
                patient_name VARCHAR(255),
                phone VARCHAR(50) NOT NULL,
                agent_name VARCHAR(100),
                scheduled_time TIMESTAMP NOT NULL,
                status VARCHAR(50) DEFAULT 'Pending'
            );
        `);
        console.log('scheduled_calls table ready.');

    } catch (err) {
        console.error('Error initializing calls tables:', err);
    } finally {
        pool.end();
    }
}

initCallsDB();
