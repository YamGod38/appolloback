require('dotenv').config();
const db = require('./src/config/db');

const mockServices = [
    { category: 'Consultation', name: 'General Physician Consultation', price: '₹500', duration: '15 mins', tier: 'Basic' },
    { category: 'Consultation', name: 'Specialist Consultation', price: '₹1,200', duration: '30 mins', tier: 'Premium' },
    { category: 'Diagnostics', name: 'Full Body Blood Test (CBC)', price: '₹850', duration: '10 mins', tier: 'Basic' },
    { category: 'Diagnostics', name: 'MRI Scan (Brain)', price: '₹7,500', duration: '45 mins', tier: 'Premium' },
    { category: 'Diagnostics', name: 'X-Ray (Chest)', price: '₹400', duration: '15 mins', tier: 'Basic' },
    { category: 'Procedure', name: 'ECG', price: '₹300', duration: '10 mins', tier: 'Basic' },
    { category: 'Procedure', name: 'Minor Suturing', price: '₹1,500', duration: '30 mins', tier: 'Standard' },
    { category: 'Emergency', name: 'Ambulance Dispatch (Base)', price: '₹2,000', duration: 'N/A', tier: 'Critical' },
    { category: 'Emergency', name: 'ICU Bed (Per Day)', price: '₹15,000', duration: '24 hours', tier: 'Critical' },
    { category: 'Pharmacy', name: 'Standard First Aid Kit', price: '₹250', duration: 'N/A', tier: 'Basic' }
];

async function setupServiceCatalog() {
    try {
        console.log('Creating service_catalog table...');
        await db.pool.query(`
            CREATE TABLE IF NOT EXISTS service_catalog (
                id SERIAL PRIMARY KEY,
                category VARCHAR(100),
                name VARCHAR(255),
                price VARCHAR(100),
                duration VARCHAR(100),
                tier VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check if data already exists
        const countRes = await db.pool.query('SELECT COUNT(*) FROM service_catalog');
        if (parseInt(countRes.rows[0].count) === 0) {
            console.log('Seeding initial mock services...');
            for (let s of mockServices) {
                await db.pool.query(
                    'INSERT INTO service_catalog (category, name, price, duration, tier) VALUES ($1, $2, $3, $4, $5)',
                    [s.category, s.name, s.price, s.duration, s.tier]
                );
            }
        }
        
        console.log('Service catalog successfully set up!');
    } catch (err) {
        console.error('Failed to setup service catalog:', err);
    } finally {
        process.exit(0);
    }
}

setupServiceCatalog();
