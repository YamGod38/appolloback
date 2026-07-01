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

async function initAttendanceDB() {
    try {
        console.log('Connecting to database...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS attendance_logs (
                id SERIAL PRIMARY KEY,
                agent_name VARCHAR(100),
                action VARCHAR(50),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('attendance_logs table ready.');

    } catch (err) {
        console.error('Error initializing attendance tables:', err);
    } finally {
        pool.end();
    }
}

initAttendanceDB();
