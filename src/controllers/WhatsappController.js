const db = require('../config/db');
const { generatePDF } = require('../utils/generateBookingSlip');

// Mock WhatsApp logs for demonstration
let mockWhatsAppLogs = [
    { id: 'WA-8092', type: 'BILL', phone: '+1 (555) 019-2834', status: 'Delivered', template: 'medical_bill_v1', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: 'WA-8091', type: 'HOTEL', phone: '+1 (555) 832-1192', status: 'Read', template: 'hotel_booking_conf', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
    { id: 'WA-8090', type: 'FEEDBACK', phone: '+1 (555) 743-9921', status: 'Received', template: 'N/A', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), message: 'Great service 5 stars' }
];

exports.getLogs = async (req, res) => {
    try {
        // Serve mock logs for now, ordered by timestamp descending
        res.json({ success: true, data: mockWhatsAppLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) });
    } catch (err) {
        console.error('Error fetching WhatsApp logs', err);
        res.status(500).json({ success: false, error: 'Failed to fetch logs' });
    }
};

exports.handleFeedbackReply = async (req, res) => {
    try {
        // In a real Twilio/Meta integration, req.body contains From, Body, etc.
        const { From, Body } = req.body;
        
        // Mocking the feedback extraction
        const patientNumber = From || 'Unknown';
        const rating = parseInt(Body) || 5;

        // Save feedback to DB (assuming feedbacks table exists or just emitting for now)
        // Emit to frontend
        const io = req.app.get('io');
        if (io) {
            io.emit('FEEDBACK_RECEIVED', {
                patientNumber,
                rating,
                timestamp: new Date()
            });
            console.log(`[WhatsApp] Feedback received from ${patientNumber}: ${rating} stars`);
        }

        // TwiML response for Twilio
        res.set('Content-Type', 'text/xml');
        res.status(200).send(`
            <Response>
                <Message>Thank you for your feedback! Your health is our priority.</Message>
            </Response>
        `);
    } catch (err) {
        console.error('Error handling feedback:', err);
        res.status(500).send('Error');
    }
};

exports.sendPDF = async (req, res) => {
    try {
        const { type, data, phone } = req.body;
        // type: 'HOTEL', 'DOCTOR', 'BILL'
        
        // 1. Generate PDF
        const pdfPath = await generatePDF(data, type);
        
        // 2. Mock sending via WhatsApp API (e.g., Twilio)
        console.log(`[WhatsApp API] Sending ${type} PDF to ${phone} from path: ${pdfPath}`);
        
        // Log it to our mock database
        mockWhatsAppLogs.unshift({
            id: `WA-${Math.floor(Math.random() * 10000)}`,
            type: type,
            phone: phone,
            status: 'Delivered',
            template: type === 'BILL' ? 'medical_bill_v1' : 'booking_slip_v2',
            timestamp: new Date().toISOString()
        });
        
        res.status(200).json({ success: true, message: 'PDF sent successfully via WhatsApp', path: pdfPath });
    } catch (err) {
        console.error('Error sending PDF:', err);
        res.status(500).json({ success: false, error: 'Failed to send PDF' });
    }
};
