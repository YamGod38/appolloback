const axios = require('axios');

class MessageController {
    static async sendMessage(req, res) {
        try {
            const { to, text } = req.body;

            if (!to || !text) {
                return res.status(400).json({ error: 'Phone number and message text are required.' });
            }

            console.log(`[UnifiedInbox] Request to send message to ${to}: "${text}"`);

            const whatsappToken = process.env.WHATSAPP_TOKEN;
            const phoneId = process.env.WHATSAPP_PHONE_ID;

            if (!whatsappToken || !phoneId) {
                // Mock execution if keys are missing
                console.log(`[UnifiedInbox MOCK] Message dispatched securely to ${to}.`);
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 600));
                return res.status(200).json({ success: true, status: 'mock_delivered' });
            }

            // Production execution to Meta Cloud API
            const messagePayload = {
                messaging_product: "whatsapp",
                to: to.replace('+', ''),
                type: "text",
                text: { body: text }
            };

            const response = await axios.post(
                `https://graph.facebook.com/v17.0/${phoneId}/messages`,
                messagePayload,
                { headers: { Authorization: `Bearer ${whatsappToken}`, 'Content-Type': 'application/json' } }
            );

            console.log(`[UnifiedInbox LIVE] Successfully dispatched to ${to}`);
            return res.status(200).json({ success: true, status: 'delivered', meta_response: response.data });

        } catch (error) {
            console.error('[UnifiedInbox Error]', error.response?.data || error.message);
            res.status(500).json({ error: 'Failed to send message.' });
        }
    }
}

module.exports = MessageController;
