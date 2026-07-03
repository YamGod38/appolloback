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

        // 6. Missed Calls Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS missed_calls (
                id SERIAL PRIMARY KEY,
                phone VARCHAR(50) NOT NULL,
                status VARCHAR(50) DEFAULT 'Pending',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 7. Attendance Logs Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS attendance_logs (
                id SERIAL PRIMARY KEY,
                agent_name VARCHAR(255) NOT NULL,
                action VARCHAR(50) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 8. Scheduled Calls Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS scheduled_calls (
                id SERIAL PRIMARY KEY,
                patient_name VARCHAR(255),
                phone VARCHAR(50) NOT NULL,
                agent_name VARCHAR(255),
                scheduled_time TIMESTAMP NOT NULL,
                status VARCHAR(50) DEFAULT 'Scheduled',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 9. Smart Beds Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS hospital_beds (
                id VARCHAR(50) PRIMARY KEY,
                ward_type VARCHAR(50) NOT NULL,
                status VARCHAR(50) DEFAULT 'Available',
                patient_name VARCHAR(255),
                assigned_at TIMESTAMP
            );
        `);

        console.log('[DB] Seeding Hospital Beds...');
        // Only insert if empty
        const bedCount = await pool.query('SELECT COUNT(*) FROM hospital_beds');
        if (parseInt(bedCount.rows[0].count) === 0) {
            const beds = [];
            // 12 ICU Beds
            for (let i=1; i<=12; i++) beds.push(`('ICU-${i}', 'ICU', 'Available', NULL)`);
            // 20 General Beds
            for (let i=1; i<=20; i++) beds.push(`('GEN-${i}', 'General', 'Available', NULL)`);
            // 4 OTs
            for (let i=1; i<=4; i++) beds.push(`('OT-${i}', 'OT', 'Available', NULL)`);
            
            // Make a few occupied for realism
            beds[0] = `('ICU-1', 'ICU', 'Occupied', 'John Doe')`;
            beds[1] = `('ICU-2', 'ICU', 'Occupied', 'Jane Smith')`;
            beds[12] = `('GEN-1', 'General', 'Occupied', 'Robert Johnson')`;

            await pool.query(`
                INSERT INTO hospital_beds (id, ward_type, status, patient_name)
                VALUES ${beds.join(', ')}
            `);
        }
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
