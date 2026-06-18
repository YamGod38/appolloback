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

console.log('WhatsApp Automation Cron Job initialized.');
