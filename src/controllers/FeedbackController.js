const db = require('../config/db');

// In-memory store for pending feedbacks
const pendingFeedbacks = new Map();

exports.sendLink = async (req, res) => {
    try {
        const { callId, patientNumber, patientName, agentName } = req.body;
        
        if (!patientNumber) {
            return res.status(400).json({ success: false, error: 'Patient number is required' });
        }

        // Store agentName so we know who to attribute the feedback to later
        if (callId && agentName) {
            pendingFeedbacks.set(callId.toString(), agentName);
        }

        const feedbackUrl = `http://localhost:5173/feedback/${callId}`;
        
        // Simulating the WhatsApp API Payload
        const whatsappPayload = {
            to: patientNumber,
            type: 'template',
            template: {
                name: 'apollo_feedback',
                language: { code: 'en_US' },
                components: [
                    { type: 'body', parameters: [{ type: 'text', text: patientName || 'Patient' }] },
                    { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: callId }] }
                ]
            }
        };

        // Simulating the SMS API Payload
        const smsPayload = {
            to: patientNumber,
            message: `Apollo Hospitals: Thank you for calling us! Please take a moment to rate your experience: ${feedbackUrl}`
        };

        console.log(`[Feedback System] Simulating dispatch to ${patientNumber}...`);
        console.log(`[WhatsApp API] Payload:`, JSON.stringify(whatsappPayload, null, 2));
        console.log(`[SMS API] Payload:`, JSON.stringify(smsPayload, null, 2));

        res.status(200).json({ success: true, message: 'Feedback links dispatched successfully' });
    } catch (err) {
        console.error('Error dispatching feedback link:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

exports.submit = async (req, res) => {
    try {
        const { callId, rating, comments } = req.body;
        
        if (!callId || !rating) {
            return res.status(400).json({ success: false, error: 'Call ID and rating are required' });
        }

        const agentName = pendingFeedbacks.get(callId.toString()) || 'Unknown Agent';
        console.log(`[Feedback System] New Feedback Received for Call ${callId} (Agent: ${agentName})! Rating: ${rating}/5, Comments: "${comments || ''}"`);

        // Emit to frontend (Control Room) for live updates
        const io = req.app.get('io');
        if (io) {
            io.emit('FEEDBACK_RECEIVED', {
                callId,
                agentName,
                rating,
                comments,
                timestamp: new Date()
            });
        }

        // Optional: clear memory if it's a one-time feedback
        pendingFeedbacks.delete(callId.toString());

        res.status(200).json({ success: true, message: 'Feedback submitted successfully' });
    } catch (err) {
        console.error('Error submitting feedback:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};
