const cron = require('node-cron');
const axios = require('axios');
const db = require('../config/db');

// Run every day at 08:00 AM
cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Scanning for chronic patients needing WhatsApp follow-up today...');
    
    try {
        let patientsToAlert = [];
        
        try {
            // Live Database Query
            const query = `
                SELECT id, full_name, phone_number, next_follow_up_date
                FROM customers_patients
                WHERE needs_follow_up = true AND next_follow_up_date <= CURRENT_DATE
            `;
            const result = await db.query(query);
            patientsToAlert = result.rows;
        } catch (dbErr) {
            console.warn('[Cron] Database offline. Using mock patients for WhatsApp automation demo.');
            patientsToAlert = [
                { id: 1, full_name: 'John Doe', phone_number: '+919876543210' },
                { id: 2, full_name: 'Jane Smith', phone_number: '+919876543211' }
            ];
        }

        const whatsappToken = process.env.WHATSAPP_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_ID;

        for (const patient of patientsToAlert) {
            const messagePayload = {
                messaging_product: "whatsapp",
                to: patient.phone_number.replace('+', ''),
                type: "template",
                template: {
                    name: "chronic_followup_reminder", // Must match your Meta approved template name
                    language: { code: "en" }
                }
            };

            if (!whatsappToken || !phoneId) {
                console.log(`[WhatsApp API MOCKED] Firing automated reminder to ${patient.phone_number} (${patient.full_name}).`);
            } else {
                console.log(`[WhatsApp API LIVE] Dispatching Meta graph payload to ${patient.phone_number}...`);
                try {
                    await axios.post(
                        `https://graph.facebook.com/v17.0/${phoneId}/messages`,
                        messagePayload,
                        { headers: { Authorization: `Bearer ${whatsappToken}`, 'Content-Type': 'application/json' } }
                    );
                    console.log(`[WhatsApp API] Successfully delivered to ${patient.full_name}.`);
                } catch (apiErr) {
                    console.error(`[WhatsApp API Error] Failed to deliver to ${patient.phone_number}:`, apiErr.response?.data || apiErr.message);
                }
            }
        }
    } catch (err) {
        console.error('[Cron Global Error]', err);
    }
});

// Run every minute to check for scheduled outbound calls
cron.schedule('* * * * *', async () => {
    try {
        const query = `
            SELECT * FROM scheduled_calls 
            WHERE status = 'Pending' AND scheduled_time <= CURRENT_TIMESTAMP
        `;
        const result = await db.query(query);
        const calls = result.rows;

        for (const call of calls) {
            console.log(`[Scheduled Call] Firing outbound call to ${call.patient_name} (${call.phone}) for agent ${call.agent_name}`);
            
            // Mocking outbound API call (Twilio/Exotel)
            // await axios.post('exotel_outbound_api_url', { From: 'system_number', To: call.phone, CallerId: 'agent_extension' });
            
            await db.query(`UPDATE scheduled_calls SET status = 'Completed' WHERE id = $1`, [call.id]);
        }
    } catch (err) {
        console.error('[Scheduled Calls Cron Error]', err);
    }
});

console.log('Cron Jobs initialized (WhatsApp automation & Outbound Scheduling).');
