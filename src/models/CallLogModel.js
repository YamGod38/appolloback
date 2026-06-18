const db = require('../config/db');

class CallLogModel {
    static async createCallLog({ callSid, customerId, callDirection, callStatus }) {
        try {
            const query = `
                INSERT INTO call_logs (call_sid, customer_id, call_direction, call_status)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const values = [callSid, customerId, callDirection, callStatus];
            const { rows } = await db.query(query, values);
            return rows[0];
        } catch (error) {
            console.error('Error creating call log:', error);
            throw error;
        }
    }
}

module.exports = CallLogModel;
