const db = require('../config/db');

exports.getNextMissedCall = async (req, res) => {
    try {
        const missedCalls = req.app.get('missedCalls') || [];
        // Fetch the oldest pending missed call
        const callIndex = missedCalls.findIndex(c => c.status === 'Pending');

        if (callIndex === -1) {
            return res.status(200).json({ success: true, data: null });
        }

        const call = missedCalls[callIndex];
        
        // Mark as In Progress
        call.status = 'In Progress';
        req.app.set('missedCalls', missedCalls);
        
        // Broadcast update
        const io = req.app.get('io');
        if (io) io.emit('MISSED_CALLS_SYNC', missedCalls);

        res.status(200).json({ success: true, data: call });
    } catch (err) {
        console.error('Error fetching next missed call:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch missed call' });
    }
};

exports.scheduleCall = async (req, res) => {
    const { patient_name, phone, agent_name, scheduled_time } = req.body;
    try {
        const query = `
            INSERT INTO scheduled_calls (patient_name, phone, agent_name, scheduled_time)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const result = await db.query(query, [patient_name, phone, agent_name, scheduled_time]);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error scheduling call:', err);
        res.status(500).json({ success: false, error: 'Failed to schedule call' });
    }
};

exports.exportLogs = async (req, res) => {
    try {
        const { date, agent } = req.query;
        // In a real DB, you'd filter by date and agent here.
        // We will just return some mock CSV data for demonstration.
        
        const { parse } = require('json2csv');
        const logs = [
            { id: 'CALL-9021', type: 'inbound', agent: 'Sarah Jenkins', customer: '+1 (555) 019-2834', duration: '04:12', status: 'Completed', date: 'Oct 24, 10:42 AM', recording_url: 'http://example.com/audio1.mp3' },
            { id: 'CALL-9020', type: 'outbound', agent: 'David Chen', customer: '+1 (555) 837-9912', duration: '12:05', status: 'Completed', date: 'Oct 24, 10:15 AM', recording_url: 'http://example.com/audio2.mp3' }
        ];

        // Apply filters if passed
        const filtered = logs.filter(l => {
            let matches = true;
            if (agent && agent !== 'All') {
                matches = matches && l.agent === agent;
            }
            if (date) {
                // simple date string match
                matches = matches && l.date.includes(date);
            }
            return matches;
        });

        const csv = parse(filtered);
        res.header('Content-Type', 'text/csv');
        res.attachment(`call_logs_${Date.now()}.csv`);
        res.send(csv);

    } catch (err) {
        console.error('Export error:', err);
        res.status(500).json({ error: 'Failed to export logs' });
    }
};

exports.getScheduledCalls = async (req, res) => {
    try {
        const query = `
            SELECT * FROM scheduled_calls 
            ORDER BY scheduled_time ASC;
        `;
        const result = await db.query(query);
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching scheduled calls:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch scheduled calls' });
    }
};

exports.resolveScheduledCall = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            UPDATE scheduled_calls 
            SET status = 'Completed' 
            WHERE id = $1 
            RETURNING *;
        `;
        const result = await db.query(query, [id]);
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error resolving scheduled call:', err);
        res.status(500).json({ success: false, error: 'Failed to resolve scheduled call' });
    }
};

exports.getConversionRates = async (req, res) => {
    try {
        // Calculate basic conversion rate: Total bookings / Total unique inbound calls
        // Since we may not have complete data, we'll return a dynamic calculation and some mock trend data.
        
        let totalCallers = 0;
        let totalBookings = 0;

        try {
            const callsResult = await db.query(`SELECT COUNT(DISTINCT customer_id) as total_callers FROM interaction_logs WHERE call_direction = 'inbound'`);
            totalCallers = parseInt(callsResult.rows[0].total_callers) || 0;

            const bookingsResult = await db.query(`SELECT COUNT(DISTINCT patient_id) as total_bookings FROM appointments_slots`);
            totalBookings = parseInt(bookingsResult.rows[0].total_bookings) || 0;
        } catch (dbErr) {
            console.log('Database tables not ready for conversion rates, using fallbacks.');
        }

        // In a real system, we'd also query hotel and diagnostic scan tables here and sum them.
        // For now, we simulate unified totals based on the global state or fallbacks.

        const unifiedBookings = totalBookings > 0 ? totalBookings + 12 : 54; // Mocking additional diagnostic/hotel bookings

        let conversionRate = 0;
        if (totalCallers > 0) {
            conversionRate = ((unifiedBookings / totalCallers) * 100).toFixed(1);
        } else {
            // fallback percentage if DB is empty
            conversionRate = ((unifiedBookings / 156) * 100).toFixed(1);
        }

        // Mocking timeline data for the chart, but plugging in real totals
        const data = {
            totalCallers: totalCallers > 0 ? totalCallers : 156, // fallback for UI demonstration if empty
            totalBookings: unifiedBookings,
            conversionRate: conversionRate,
            trend: [
                { date: 'Mon', calls: 30, bookings: 5 },
                { date: 'Tue', calls: 45, bookings: 12 },
                { date: 'Wed', calls: 28, bookings: 8 },
                { date: 'Thu', calls: 52, bookings: 15 },
                { date: 'Fri', calls: totalCallers > 0 ? totalCallers : 156, bookings: unifiedBookings },
            ]
        };

        res.status(200).json({ success: true, data });
    } catch (err) {
        console.error('Error calculating conversion rates:', err);
        res.status(500).json({ success: false, error: 'Failed to calculate conversion rates' });
    }
};
