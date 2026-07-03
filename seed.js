require('dotenv').config();
const db = require('./src/config/db');

const seedDatabase = async () => {
    try {
        console.log('Seeding Database with Mock Data...');

        // 1. Seed Patients
        console.log('Seeding Patients...');
        const patients = [
            { huid: 'HUID-1001', phone: '555-0101', name: 'John Doe', last_visited: '2023-10-01' },
            { huid: 'HUID-1002', phone: '555-0102', name: 'Jane Smith', last_visited: '2023-10-05' },
            { huid: 'HUID-1003', phone: '555-0103', name: 'Alice Johnson', last_visited: '2023-10-10' },
            { huid: 'HUID-1004', phone: '555-0104', name: 'Bob Brown', last_visited: '2023-10-12' },
            { huid: 'HUID-1005', phone: '555-0105', name: 'Charlie Davis', last_visited: '2023-10-15' },
        ];
        
        for (const p of patients) {
            try {
                await db.query(
                    `INSERT INTO customers_patients (huid, phone_number, full_name, last_visited) 
                     VALUES ($1, $2, $3, $4)`,
                    [p.huid, p.phone, p.name, p.last_visited]
                );
            } catch (err) {
                // Ignore duplicates if any
            }
        }

        // 2. Seed Bookings
        console.log('Seeding Bookings...');
        const agents = ['Agent Alpha', 'Agent Beta', 'Agent Gamma'];
        const statuses = ['Pending', 'Verified', 'Cancelled'];
        
        const bookings = [
            // Appointments
            { type: 'APPOINTMENT', patient_name: 'John Doe', huid: 'HUID-1001', phone: '555-0101', details: 'Dr. Sarah Chen', date: '2023-10-20', time: '10:00 AM', agent: 'Agent Alpha', address: null, status: 'Verified' },
            { type: 'APPOINTMENT', patient_name: 'Alice Johnson', huid: 'HUID-1003', phone: '555-0103', details: 'Dr. Marcus Thorne', date: '2023-10-21', time: '11:30 AM', agent: 'Agent Beta', address: null, status: 'Pending' },
            // Scans
            { type: 'SCAN', patient_name: 'Jane Smith', huid: 'HUID-1002', phone: '555-0102', details: 'MRI Scan', date: '2023-10-22', time: '09:00 AM', agent: 'Agent Alpha', address: null, status: 'Verified' },
            { type: 'SCAN', patient_name: 'Charlie Davis', huid: 'HUID-1005', phone: '555-0105', details: 'CT Scan', date: '2023-10-23', time: '02:00 PM', agent: 'Agent Gamma', address: null, status: 'Pending' },
            // Hotels
            { type: 'HOTEL', patient_name: 'Bob Brown', huid: 'HUID-1004', phone: '555-0104', details: 'Apollo Suites - Deluxe', date: '2023-10-24', time: 'Check-in', agent: 'Agent Beta', address: null, status: 'Verified' },
            // Blood Collection
            { type: 'BLOOD_COLLECTION', patient_name: 'John Doe', huid: 'HUID-1001', phone: '555-0101', details: 'Tests: CBC, Lipid Profile', date: '2023-10-25', time: '07:00 AM', agent: 'Agent Alpha', address: '123 Main St, Apt 4B', status: 'Pending' },
            { type: 'BLOOD_COLLECTION', patient_name: 'Jane Smith', huid: 'HUID-1002', phone: '555-0102', details: 'Tests: Thyroid, HbA1c', date: '2023-10-26', time: '08:00 AM', agent: 'Agent Gamma', address: '456 Oak Ave', status: 'Verified' },
        ];

        // Also add some random recent bookings for today
        const today = new Date().toISOString().split('T')[0];
        bookings.push({ type: 'APPOINTMENT', patient_name: 'Random User 1', huid: 'HUID-9991', phone: '555-9991', details: 'Dr. Emily Ross', date: today, time: '01:00 PM', agent: 'Agent Alpha', address: null, status: 'Pending' });
        bookings.push({ type: 'SCAN', patient_name: 'Random User 2', huid: 'HUID-9992', phone: '555-9992', details: 'X-Ray', date: today, time: '02:30 PM', agent: 'Agent Beta', address: null, status: 'Verified' });
        bookings.push({ type: 'BLOOD_COLLECTION', patient_name: 'Random User 3', huid: 'HUID-9993', phone: '555-9993', details: 'Tests: Complete Panel', date: today, time: '06:30 AM', agent: 'Agent Gamma', address: '789 Pine Rd', status: 'Verified' });

        for (const b of bookings) {
            await db.query(
                `INSERT INTO bookings (type, patient_name, huid, phone_number, details, booking_date, booking_time, agent_name, address, status) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [b.type, b.patient_name, b.huid, b.phone, b.details, b.date, b.time, b.agent, b.address, b.status]
            );
        }

        // 3. Seed Attendance Logs
        console.log('Seeding Attendance Logs...');
        for (let i = 0; i < 5; i++) {
            await db.query(
                'INSERT INTO attendance_logs (agent_name, action, timestamp) VALUES ($1, $2, $3)',
                [agents[Math.floor(Math.random() * agents.length)], 'Clocked In', new Date(Date.now() - i * 3600000).toISOString()]
            );
            await db.query(
                'INSERT INTO attendance_logs (agent_name, action, timestamp) VALUES ($1, $2, $3)',
                [agents[Math.floor(Math.random() * agents.length)], 'Clocked Out', new Date(Date.now() - i * 3600000 + 1800000).toISOString()]
            );
        }

        console.log('Successfully seeded database with mock data!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
};

seedDatabase();
