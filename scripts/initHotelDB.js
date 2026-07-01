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

async function initDB() {
    try {
        console.log('Connecting to database...');
        
        // 1. Create Hotels Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS hotels (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                location VARCHAR(255) NOT NULL,
                rating VARCHAR(50),
                type VARCHAR(50)
            );
        `);
        console.log('Hotels table ready.');

        // 2. Create Rooms Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                id SERIAL PRIMARY KEY,
                hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
                room_type VARCHAR(100) NOT NULL,
                price VARCHAR(50),
                status VARCHAR(50) DEFAULT 'Available'
            );
        `);
        console.log('Rooms table ready.');

        // 3. Create Hotel Bookings Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS hotel_bookings (
                id SERIAL PRIMARY KEY,
                hotel_id INTEGER REFERENCES hotels(id),
                room_id INTEGER REFERENCES rooms(id),
                patient_name VARCHAR(255),
                guest_names JSONB,
                check_in DATE,
                check_out DATE,
                agent_name VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Hotel Bookings table ready.');

        // 4. Seed Initial Data
        const checkHotels = await pool.query('SELECT COUNT(*) FROM hotels');
        if (parseInt(checkHotels.rows[0].count) === 0) {
            console.log('Seeding initial hotels and rooms...');
            
            const insertHotelQuery = `
                INSERT INTO hotels (name, location, rating, type) VALUES 
                ('The Grand Plaza', 'Downtown Medical District', '5 Star', 'Luxury'),
                ('Wellness Retreat Resort', 'Coastal Healing Zone', '5 Star', 'Resort'),
                ('Apollo Suites', 'Hospital Campus', '4 Star', 'Convenience')
                RETURNING id, name;
            `;
            const hotelRes = await pool.query(insertHotelQuery);
            
            for (let hotel of hotelRes.rows) {
                const insertRoomsQuery = `
                    INSERT INTO rooms (hotel_id, room_type, price, status) VALUES 
                    ($1, 'Standard Recovery', '$150/night', 'Available'),
                    ($1, 'Deluxe Suite', '$300/night', 'Available'),
                    ($1, 'VIP Penthouse', '$850/night', 'Available')
                `;
                await pool.query(insertRoomsQuery, [hotel.id]);
            }
            console.log('Database seeded successfully!');
        } else {
            console.log('Hotels already exist, skipping seed.');
        }

    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        pool.end();
    }
}

initDB();
