require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

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

async function initUsersDB() {
    try {
        console.log('Connecting to database...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'USER',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('users table ready.');

        // Insert default admin
        const adminEmail = 'admin@apollo.com';
        const check = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
        
        if (check.rows.length === 0) {
            const hash = await bcrypt.hash('admin', 10);
            await pool.query(
                'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4)',
                [adminEmail, hash, 'Admin User', 'ADMIN']
            );
            console.log('Default admin seeded: admin@apollo.com / admin');
        } else {
            console.log('Admin user already exists.');
        }

        // Insert default agent
        const agentEmail = 'agent@apollo.com';
        const checkAgent = await pool.query('SELECT * FROM users WHERE email = $1', [agentEmail]);
        if (checkAgent.rows.length === 0) {
            const hashAgent = await bcrypt.hash('agent', 10);
            await pool.query(
                'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4)',
                [agentEmail, hashAgent, 'Agent Alpha', 'AGENT']
            );
            console.log('Default agent seeded: agent@apollo.com / agent');
        }

    } catch (err) {
        console.error('Error initializing users table:', err);
    } finally {
        pool.end();
    }
}

initUsersDB();
