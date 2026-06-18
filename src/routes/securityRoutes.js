const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is missing in .env');
    process.exit(1);
}
router.post('/idle-alert', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized. No token provided.' });
        
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ error: 'Invalid token.' });
        }

        const { agentName, strikes, timestamp } = req.body;
        
        // We ensure only USER roles trigger this, or just log it
        if (decoded.role !== 'AGENT' && decoded.role !== 'USER') {
            return res.status(403).json({ error: 'Only agents can trigger idle alerts.' });
        }

        console.log(`[SECURITY] Agent ${agentName} (${decoded.id}) triggered idle alert. Strikes: ${strikes}`);
        
        // Broadcast via socket to admin dashboards
        const io = req.app.get('io');
        if (io) {
            io.emit('SECURITY_ALERT', {
                type: 'IDLE_VIOLATION',
                agentName: agentName,
                email: 'Unknown (Token Auth)',
                strikes: strikes,
                timestamp: timestamp || new Date().toISOString()
            });
        }

        res.status(200).json({ message: 'Alert registered successfully' });
    } catch (err) {
        console.error('Idle alert error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
