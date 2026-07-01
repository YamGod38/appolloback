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

async function initLeadsDB() {
    try {
        console.log('Connecting to database...');
        
        // Create Leads Table
        await pool.query(`
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
        console.log('Leads table ready.');

        // Seed Initial Data
        const checkLeads = await pool.query('SELECT COUNT(*) FROM leads');
        if (parseInt(checkLeads.rows[0].count) === 0) {
            console.log('Seeding initial leads...');
            
            const insertQuery = `
                INSERT INTO leads (name, email, phone, status, source, notes, assigned_to) VALUES 
                ('Michael Scott', 'mscott@dundermifflin.com', '+1 555-0101', 'New', 'Website', 'Interested in premium wellness package', 'Agent Alpha'),
                ('Dwight Schrute', 'dschrute@dundermifflin.com', '+1 555-0102', 'Contacted', 'Inbound Call', 'Needs a beet-based diet consultation', 'Agent Bravo'),
                ('Jim Halpert', 'jhalpert@dundermifflin.com', '+1 555-0103', 'Qualified', 'Referral', 'Looking for routine checkups', 'Agent Alpha'),
                ('Pam Beesly', 'pbeesly@dundermifflin.com', '+1 555-0104', 'Converted', 'Website', 'Booked appointment successfully', 'Agent Alpha')
            `;
            await pool.query(insertQuery);
            console.log('Leads database seeded successfully!');
        } else {
            console.log('Leads already exist, skipping seed.');
        }

    } catch (err) {
        console.error('Error initializing leads database:', err);
    } finally {
        pool.end();
    }
}

initLeadsDB();
