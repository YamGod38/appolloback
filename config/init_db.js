require('dotenv').config({ path: '../../.env' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'admin',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'apollo_hotel_crm'
});

const executeMigration = async () => {
    try {
        console.log('[DB] Connecting to Postgres...');
        await pool.query('SELECT NOW()');

        console.log('[DB] Executing schema migrations...');

        // 1. Users Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) CHECK (role IN ('ADMIN', 'AGENT')) DEFAULT 'AGENT',
                skills TEXT[],
                status VARCHAR(50) DEFAULT 'Offline',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Customers Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS customers_patients (
                id SERIAL PRIMARY KEY,
                phone_number VARCHAR(20) UNIQUE NOT NULL,
                full_name VARCHAR(255),
                entity_type VARCHAR(50) CHECK (entity_type IN ('apollo_patient', 'hotel_guest')),
                chronic_diseases TEXT[],
                needs_follow_up BOOLEAN DEFAULT false,
                next_follow_up_date DATE,
                prescription_urls TEXT[],
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Appointments Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS appointments_slots (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER REFERENCES customers_patients(id),
                agent_id INTEGER REFERENCES users(id),
                doctor_name VARCHAR(255),
                appointment_time TIMESTAMP NOT NULL,
                status VARCHAR(50) DEFAULT 'Scheduled',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 4. Interaction Logs Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS interaction_logs (
                id SERIAL PRIMARY KEY,
                call_sid VARCHAR(255) UNIQUE,
                user_id INTEGER REFERENCES users(id),
                customer_id INTEGER REFERENCES customers_patients(id),
                call_direction VARCHAR(50),
                call_status VARCHAR(50),
                recording_url TEXT,
                ai_summary TEXT,
                sentiment_score VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 5. Knowledge Base Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS knowledge_base (
                id SERIAL PRIMARY KEY,
                category VARCHAR(100),
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                tags TEXT[],
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('[DB] Seeding default Admin and Agent users...');
        const adminHash = await bcrypt.hash('admin', 10);
        const agentHash = await bcrypt.hash('agent', 10);

        await pool.query(`
            INSERT INTO users (full_name, email, password_hash, role)
            VALUES ('Admin User', 'admin@apollo.com', $1, 'ADMIN')
            ON CONFLICT (email) DO NOTHING;
        `, [adminHash]);

        await pool.query(`
            INSERT INTO users (full_name, email, password_hash, role)
            VALUES ('Agent Alpha', 'agent@apollo.com', $1, 'AGENT')
            ON CONFLICT (email) DO NOTHING;
        `, [agentHash]);

        console.log('[DB] Seeding Knowledge Base data...');
        await pool.query(`
            INSERT INTO knowledge_base (category, title, content, tags)
            VALUES ('Medical', 'Blood Pressure Protocol', 'If BP > 140/90, escalate to senior doctor immediately.', ARRAY['bp', 'blood pressure'])
            ON CONFLICT DO NOTHING;
        `).catch(() => {}); // ignore duplicate conflict if not unique

        console.log('[DB] Database Seeded Successfully!');
        process.exit(0);
    } catch (err) {
        console.error('[DB Error] Failed to execute migrations:', err);
        process.exit(1);
    }
};

executeMigration();
