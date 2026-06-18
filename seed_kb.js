const { Pool } = require('pg');

const db = new Pool({
    user: 'admin',
    host: 'localhost',
    database: 'apollo_hotel_crm',
    password: 'admin', 
    port: 5432,
});

async function seed() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS knowledge_base (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                tags TEXT[]
            );
        `);
        
        // Clear existing just in case
        await db.query('TRUNCATE knowledge_base RESTART IDENTITY CASCADE;');

        const items = [
            { title: 'Blood Pressure Protocol', content: 'If patient reports BP > 140/90, instruct them to sit quietly for 5 minutes and re-measure. If still high, escalate to senior cardiologist.', tags: ['bp', 'blood pressure', 'hypertension', 'heart'] },
            { title: 'Hotel Suite Pricing', content: 'Presidential suite is $500/night. Executive suite is $350/night. Both include complimentary breakfast and spa access.', tags: ['price', 'room', 'hotel', 'suite', 'booking'] },
            { title: 'Sugar Testing Protocol', content: 'Instruct patient to fast for 12 hours before test. Only water is permitted. No coffee, tea, or chewing gum.', tags: ['sugar', 'diabetes', 'glucose', 'fasting', 'test'] },
            { title: 'Appointment Cancellation Policy', content: 'Cancellations must be made at least 24 hours in advance to avoid a 50% penalty fee. Rescheduling within 24 hours is allowed once for free.', tags: ['cancel', 'policy', 'appointment', 'fee'] },
            { title: 'General Checkup Prep', content: 'Patient should arrive 15 minutes early to fill out forms. Bring valid ID and current insurance card.', tags: ['checkup', 'prep', 'insurance', 'forms'] },
            { title: 'Post-Surgery Care', content: 'Keep the surgical site clean and dry. Change dressings daily. Take prescribed antibiotics to completion.', tags: ['surgery', 'care', 'recovery', 'wound'] },
            { title: 'Pediatric Fever Guidelines', content: 'For children under 3 months with a fever above 100.4°F (38°C), advise immediate emergency room visit. For older children, administer weight-appropriate acetaminophen.', tags: ['fever', 'pediatric', 'child', 'temperature', 'emergency'] },
            { title: 'Emergency Room Intake', content: 'Prioritize chest pain, difficulty breathing, and severe bleeding. Send immediately to triage.', tags: ['emergency', 'triage', 'er', 'chest pain'] },
            { title: 'Prescription Refill Process', content: 'Refill requests take 48 hours to process. Patient must have had an appointment within the last 6 months for chronic medications.', tags: ['prescription', 'refill', 'medication', 'pharmacy'] }
        ];

        for (const item of items) {
            await db.query(
                'INSERT INTO knowledge_base (title, content, tags) VALUES ($1, $2, $3)',
                [item.title, item.content, item.tags]
            );
        }

        console.log('Knowledge Base seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding DB:', err);
        process.exit(1);
    }
}

seed();
