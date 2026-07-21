require('dotenv').config();
const db = require('./src/config/db');

const today = new Date().toLocaleDateString('en-CA');
const now = new Date();
const h = now.getHours();
const m = Math.floor(now.getMinutes() / 15) * 15;
const startH = h % 12 || 12;
const startAmPm = h >= 12 ? 'PM' : 'AM';
const startM = m.toString().padStart(2, '0');
let endH = h;
let endM = m + 15;
if (endM >= 60) { endM -= 60; endH += 1; }
const endH12 = endH % 12 || 12;
const endAmPm = endH >= 12 && endH < 24 ? 'PM' : 'AM';
const endMStr = endM.toString().padStart(2, '0');
const slot = `${startH}:${startM} ${startAmPm} - ${endH12}:${endMStr} ${endAmPm}`;

const queries = [
    `INSERT INTO bookings (type, patient_name, huid, phone_number, details, booking_date, booking_time, agent_name, status) VALUES ('APPOINTMENT', 'Aarav Patel', 'HUID-9901', '9876543210', 'Dr. Sharma (Token: P1)', '${today}', '${slot}', 'System', 'Pending')`,
    `INSERT INTO bookings (type, patient_name, huid, phone_number, details, booking_date, booking_time, agent_name, status) VALUES ('APPOINTMENT', 'Riya Singh', 'HUID-9902', '9876543211', 'Dr. Sharma (Token: 1)', '${today}', '${slot}', 'System', 'Pending')`,
    `INSERT INTO bookings (type, patient_name, huid, phone_number, details, booking_date, booking_time, agent_name, status) VALUES ('APPOINTMENT', 'Vikram Malhotra', 'HUID-9903', '9876543212', 'Dr. Gupta (Token: P1)', '${today}', '${slot}', 'System', 'Pending')`,
    `INSERT INTO bookings (type, patient_name, huid, phone_number, details, booking_date, booking_time, agent_name, status) VALUES ('APPOINTMENT', 'Neha Desai', 'HUID-9904', '9876543213', 'Dr. Gupta (Token: 1)', '${today}', '${slot}', 'System', 'Pending')`,
    `INSERT INTO bookings (type, patient_name, huid, phone_number, details, booking_date, booking_time, agent_name, status) VALUES ('APPOINTMENT', 'Ananya Kapoor', 'HUID-9905', '9876543214', 'Dr. Gupta (Token: 2)', '${today}', '${slot}', 'System', 'Pending')`
];

async function seed() {
    try {
        for (let q of queries) {
            await db.pool.query(q);
        }
        console.log('Mock data added');
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}
seed();
