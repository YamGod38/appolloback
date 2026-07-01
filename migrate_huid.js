require('dotenv').config({ path: './.env' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'admin',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'apollo_hotel_crm'
});

async function migrate() {
    try {
        console.log('Starting HUID migration...');
        
        // 1. Add huid to customers_patients if not exists
        await pool.query(`
            ALTER TABLE customers_patients 
            ADD COLUMN IF NOT EXISTS huid VARCHAR(50) UNIQUE;
        `);
        console.log('Added huid column.');

        // 2. Generate HUIDs for existing rows where huid is null
        const res = await pool.query(`SELECT id FROM customers_patients WHERE huid IS NULL`);
        for (let row of res.rows) {
            const newHuid = 'AP-' + Math.floor(100000 + Math.random() * 900000);
            await pool.query(`UPDATE customers_patients SET huid = $1 WHERE id = $2`, [newHuid, row.id]);
        }
        console.log(`Generated HUIDs for ${res.rows.length} existing patients.`);

        // 3. Create family_members table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS family_members (
                id SERIAL PRIMARY KEY,
                primary_huid VARCHAR(50) REFERENCES customers_patients(huid),
                name VARCHAR(255) NOT NULL,
                relation VARCHAR(50),
                age INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Created family_members table.');

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
