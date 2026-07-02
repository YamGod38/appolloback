require('dotenv').config({ path: './.env' });
const db = require('./src/config/db');

async function seedData() {
    try {
        console.log('Seeding mock Indian patient data...');

        // Patient 1
        const p1Huid = 'AP-' + Math.floor(100000 + Math.random() * 900000);
        await db.query(`
            INSERT INTO customers_patients (
                huid, full_name, phone_number, email, dob, 
                gender, blood_group, weight, height, allergies, chronic_conditions, 
                emergency_contact_name, emergency_contact_phone, address
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
            p1Huid, 'Rahul Sharma', '+91 9876543210', 'rahul.s@example.in', '1985-04-12',
            'Male', 'O+', '78', '175', 'Dust, Pollen', 'Mild Hypertension',
            'Priya Sharma', '+91 9876543211', 'Flat 4B, Green Park Apartments, New Delhi, Delhi 110016'
        ]);

        await db.query(`INSERT INTO family_members (primary_huid, name, relation, age) VALUES ($1, $2, $3, $4)`, [p1Huid, 'Priya Sharma', 'Spouse', 38]);
        await db.query(`INSERT INTO family_members (primary_huid, name, relation, age) VALUES ($1, $2, $3, $4)`, [p1Huid, 'Aarav Sharma', 'Child', 12]);


        // Patient 2
        const p2Huid = 'AP-' + Math.floor(100000 + Math.random() * 900000);
        await db.query(`
            INSERT INTO customers_patients (
                huid, full_name, phone_number, email, dob, 
                gender, blood_group, weight, height, allergies, chronic_conditions, 
                emergency_contact_name, emergency_contact_phone, address
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
            p2Huid, 'Anjali Desai', '+91 8765432109', 'anjali.desai92@example.in', '1992-09-25',
            'Female', 'B+', '62', '160', 'Penicillin', 'None',
            'Vikram Desai', '+91 8765432110', '12, Sunrise Colony, Andheri West, Mumbai, Maharashtra 400053'
        ]);
        await db.query(`INSERT INTO family_members (primary_huid, name, relation, age) VALUES ($1, $2, $3, $4)`, [p2Huid, 'Vikram Desai', 'Parent', 60]);


        // Patient 3
        const p3Huid = 'AP-' + Math.floor(100000 + Math.random() * 900000);
        await db.query(`
            INSERT INTO customers_patients (
                huid, full_name, phone_number, email, dob, 
                gender, blood_group, weight, height, allergies, chronic_conditions, 
                emergency_contact_name, emergency_contact_phone, address
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
            p3Huid, 'Karthik Iyer', '+91 7654321098', 'kiyer.tech@example.in', '1978-11-05',
            'Male', 'A-', '85', '182', 'None', 'Type 2 Diabetes',
            'Meera Iyer', '+91 7654321099', 'Plot 45, Koramangala 4th Block, Bengaluru, Karnataka 560034'
        ]);
        
        console.log('Mock data seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Failed to seed data:', err);
        process.exit(1);
    }
}

seedData();
