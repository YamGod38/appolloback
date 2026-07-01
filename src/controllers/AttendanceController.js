const db = require('../config/db');
const { parse } = require('json2csv');

class AttendanceController {
    static async getLogs(req, res) {
        try {
            const { agent, date, search } = req.query;
            let query = 'SELECT * FROM attendance_logs WHERE 1=1';
            let params = [];
            let paramIndex = 1;

            if (agent && agent !== 'All') {
                query += ` AND agent_name = $${paramIndex}`;
                params.push(agent);
                paramIndex++;
            }

            if (date) {
                query += ` AND DATE(timestamp) = $${paramIndex}`;
                params.push(date);
                paramIndex++;
            }

            if (search) {
                query += ` AND (agent_name ILIKE $${paramIndex} OR action ILIKE $${paramIndex})`;
                params.push(`%${search}%`);
                paramIndex++;
            }

            query += ' ORDER BY timestamp DESC LIMIT 500';

            const result = await db.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error fetching attendance logs:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    }

    static async exportLogs(req, res) {
        try {
            const { agent, date } = req.query;
            let query = 'SELECT agent_name, action, timestamp FROM attendance_logs WHERE 1=1';
            let params = [];
            let paramIndex = 1;

            if (agent && agent !== 'All') {
                query += ` AND agent_name = $${paramIndex}`;
                params.push(agent);
                paramIndex++;
            }

            if (date) {
                query += ` AND DATE(timestamp) = $${paramIndex}`;
                params.push(date);
                paramIndex++;
            }

            query += ' ORDER BY timestamp DESC';
            const result = await db.query(query, params);

            if (result.rows.length === 0) {
                return res.status(404).send('No records found for export.');
            }

            const csv = parse(result.rows);
            res.header('Content-Type', 'text/csv');
            res.attachment(`attendance_logs_${new Date().toISOString().slice(0, 10)}.csv`);
            return res.send(csv);

        } catch (error) {
            console.error('Error exporting attendance logs:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    }
}

module.exports = AttendanceController;
