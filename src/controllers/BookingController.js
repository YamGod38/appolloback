const db = require('../config/db');

class BookingController {
    static async createBooking(req, res) {
        try {
            const { type, patient_name, huid, phone_number, details, booking_date, booking_time, agent_name, address } = req.body;
            
            const result = await db.query(
                `INSERT INTO bookings (type, patient_name, huid, phone_number, details, booking_date, booking_time, agent_name, address, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
                [type, patient_name, huid, phone_number, details, booking_date, booking_time, agent_name, address, 'Pending']
            );
            
            // Note: Broadcasting via socket should happen from server.js, but we can return the booking
            res.json({ success: true, booking: result.rows[0] });
        } catch (err) {
            console.error('Failed to create booking', err);
            res.status(500).json({ error: 'Failed to create booking' });
        }
    }

    static async getAllBookings(req, res) {
        try {
            const result = await db.query('SELECT * FROM bookings ORDER BY created_at DESC');
            res.json({ success: true, bookings: result.rows });
        } catch (err) {
            console.error('Failed to fetch bookings', err);
            res.status(500).json({ error: 'Failed to fetch bookings' });
        }
    }
}

module.exports = BookingController;
