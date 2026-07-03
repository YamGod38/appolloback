require('dotenv').config();
const db = require('./src/config/db');

const seedAll = async () => {
    try {
        console.log('Seeding Database with extra mock data...');

        // Missed Calls
        const missedCalls = [
            { phone: '555-1234', status: 'Pending' },
            { phone: '555-5678', status: 'In Progress' },
            { phone: '555-9012', status: 'Resolved' },
        ];
        for (const mc of missedCalls) {
            await db.query(
                'INSERT INTO missed_calls (phone, status) VALUES ($1, $2)',
                [mc.phone, mc.status]
            );
        }

        // Scheduled Calls
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const scheduledCalls = [
            { patient_name: 'David Lee', phone: '555-1111', agent_name: 'Agent Alpha', scheduled_time: today.toISOString(), status: 'Scheduled' },
            { patient_name: 'Emma Watson', phone: '555-2222', agent_name: 'Agent Beta', scheduled_time: tomorrow.toISOString(), status: 'Scheduled' },
        ];
        for (const sc of scheduledCalls) {
            await db.query(
                'INSERT INTO scheduled_calls (patient_name, phone, agent_name, scheduled_time, status) VALUES ($1, $2, $3, $4, $5)',
                [sc.patient_name, sc.phone, sc.agent_name, sc.scheduled_time, sc.status]
            );
        }

        // Knowledge Base
        const kb = [
            { category: 'General', title: 'Hotel Policies', content: 'Check-in is at 2 PM, check-out at 11 AM. No smoking.', tags: ['hotel', 'policies'] },
            { category: 'Medical', title: 'Fasting Instructions', content: 'Patient must fast for 12 hours before Lipid Profile and Fasting Blood Sugar tests. Only water is allowed.', tags: ['blood', 'fasting'] },
            { category: 'Technical', title: 'Dashboard Troubleshooting', content: 'If the dashboard hangs, try refreshing the page or clearing the browser cache.', tags: ['dashboard', 'troubleshoot'] },
        ];
        for (const k of kb) {
            await db.query(
                'INSERT INTO knowledge_base (category, title, content, tags) VALUES ($1, $2, $3, $4)',
                [k.category, k.title, k.content, k.tags]
            );
        }

        // Interaction Logs
        const logs = [
            { call_sid: 'CA1234567890abcdef', user_id: 2, call_direction: 'inbound', call_status: 'completed', ai_summary: 'Patient called to inquire about doctor availability. Agent booked an appointment with Dr. Sarah Chen.', sentiment_score: 'positive' },
            { call_sid: 'CA0987654321fedcba', user_id: 2, call_direction: 'outbound', call_status: 'completed', ai_summary: 'Follow-up call to confirm MRI scan timing. Patient confirmed.', sentiment_score: 'neutral' },
        ];
        for (const l of logs) {
            try {
                await db.query(
                    'INSERT INTO interaction_logs (call_sid, user_id, call_direction, call_status, ai_summary, sentiment_score) VALUES ($1, $2, $3, $4, $5, $6)',
                    [l.call_sid, l.user_id, l.call_direction, l.call_status, l.ai_summary, l.sentiment_score]
                );
            } catch (err) {
                // Ignore conflict if it happens
            }
        }

        console.log('Successfully seeded extra tables with mock data!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
};

seedAll();
