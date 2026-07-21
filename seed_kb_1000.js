require('dotenv').config();
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

const db = new Pool(poolConfig);

const categories = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology', 'Emergency', 'Billing', 'Insurance', 'Pharmacy', 'Radiology', 'Surgery', 'Maternity'];
const actionVerbs = ['Protocol', 'Guidelines', 'Procedure', 'Policy', 'Instructions', 'FAQ', 'Workflow', 'Checklist', 'SOP'];
const adjectives = ['Emergency', 'Routine', 'Urgent', 'Standard', 'Outpatient', 'Inpatient', 'Post-Op', 'Pre-Op', 'Consultation', 'Follow-up'];
const keywordsPool = ['appointment', 'booking', 'cancellation', 'fee', 'payment', 'doctor', 'specialist', 'scan', 'test', 'blood', 'report', 'discharge', 'admission', 'bed', 'ward', 'surgery', 'medication', 'refill', 'prescription', 'symptoms', 'pain', 'fever', 'diet', 'rehab', 'therapy', 'vaccine', 'insurance', 'claim', 'copay', 'deductible', 'emergency', 'trauma', 'ambulance'];

// Generate 1000 items
const generateItems = (count) => {
    const items = [];
    for (let i = 0; i < count; i++) {
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const verb = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        
        const title = `${adj} ${cat} ${verb} #${i+1000}`;
        
        const content = `This is the standard ${verb.toLowerCase()} for ${adj.toLowerCase()} ${cat} scenarios. When patients inquire about this topic, agents should verify their identity, check their medical history, and direct them to the appropriate specialist. Ensure all ${keywordsPool[Math.floor(Math.random() * keywordsPool.length)]} details are recorded in the CRM.`;
        
        // Randomly pick 3-5 tags
        const tags = [cat.toLowerCase()];
        const numTags = Math.floor(Math.random() * 3) + 2;
        for (let j = 0; j < numTags; j++) {
            tags.push(keywordsPool[Math.floor(Math.random() * keywordsPool.length)]);
        }
        
        items.push({ title, content, tags: [...new Set(tags)] });
    }
    return items;
};

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
        
        await db.query('TRUNCATE knowledge_base RESTART IDENTITY CASCADE;');

        const baseItems = [
            { title: 'Blood Pressure Protocol', content: 'If patient reports BP > 140/90, instruct them to sit quietly for 5 minutes and re-measure. If still high, escalate to senior cardiologist.', tags: ['bp', 'blood pressure', 'hypertension', 'heart'] },
            { title: 'Hotel Suite Pricing', content: 'Presidential suite is $500/night. Executive suite is $350/night. Both include complimentary breakfast and spa access.', tags: ['price', 'room', 'hotel', 'suite', 'booking'] },
            { title: 'Sugar Testing Protocol', content: 'Instruct patient to fast for 12 hours before test. Only water is permitted. No coffee, tea, or chewing gum.', tags: ['sugar', 'diabetes', 'glucose', 'fasting', 'test'] },
            { title: 'Appointment Cancellation Policy', content: 'Cancellations must be made at least 24 hours in advance to avoid a 50% penalty fee. Rescheduling within 24 hours is allowed once for free.', tags: ['cancel', 'policy', 'appointment', 'fee'] }
        ];

        const generatedItems = generateItems(1050);
        const allItems = [...baseItems, ...generatedItems];

        // Batch insert for performance
        let values = [];
        let queryParams = [];
        let index = 1;

        for (const item of allItems) {
            values.push(`($${index}, $${index + 1}, $${index + 2})`);
            queryParams.push(item.title, item.content, item.tags);
            index += 3;

            // Execute in batches of 100 to avoid query size limits
            if (values.length >= 100) {
                const queryText = `INSERT INTO knowledge_base (title, content, tags) VALUES ${values.join(',')}`;
                await db.query(queryText, queryParams);
                values = [];
                queryParams = [];
                index = 1;
            }
        }
        
        // Insert remaining
        if (values.length > 0) {
            const queryText = `INSERT INTO knowledge_base (title, content, tags) VALUES ${values.join(',')}`;
            await db.query(queryText, queryParams);
        }

        console.log(`Knowledge Base seeded successfully with ${allItems.length} topics!`);
        process.exit(0);
    } catch (err) {
        console.error('Error seeding DB:', err);
        process.exit(1);
    }
}

seed();
