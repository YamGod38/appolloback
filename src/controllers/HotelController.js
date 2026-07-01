const db = require('../config/db');

exports.getHotels = async (req, res) => {
    try {
        const hotelQuery = 'SELECT * FROM hotels';
        const hotels = await db.query(hotelQuery);

        const roomQuery = "SELECT * FROM rooms WHERE status = 'Available'";
        const rooms = await db.query(roomQuery);

        // Map rooms to their respective hotels
        const hotelsWithRooms = hotels.rows.map(hotel => {
            return {
                ...hotel,
                rooms: rooms.rows.filter(room => room.hotel_id === hotel.id)
            };
        });

        res.status(200).json({ success: true, data: hotelsWithRooms });
    } catch (err) {
        console.error('Error fetching hotels:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch hotels' });
    }
};

exports.bookRoom = async (req, res) => {
    const { hotel_id, room_id, patient_name, guest_names, check_in, check_out, agent_name } = req.body;
    
    try {
        // 1. Mark room as Occupied
        await db.query("UPDATE rooms SET status = 'Occupied' WHERE id = $1", [room_id]);

        // 2. Insert booking
        const bookingQuery = `
            INSERT INTO hotel_bookings (hotel_id, room_id, patient_name, guest_names, check_in, check_out, agent_name)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        // Convert guest_names array to JSON string for Postgres JSONB column
        const guestNamesJson = JSON.stringify(guest_names || []);
        const booking = await db.query(bookingQuery, [hotel_id, room_id, patient_name, guestNamesJson, check_in, check_out, agent_name]);

        // 3. Fetch hotel details for the websocket blast
        const hotelData = await db.query("SELECT name FROM hotels WHERE id = $1", [hotel_id]);
        const roomData = await db.query("SELECT room_type FROM rooms WHERE id = $1", [room_id]);

        const io = req.app.get('io');
        if (io) {
            io.emit('HOTEL_BOOKING_MADE', {
                patientName: patient_name,
                hotel: hotelData.rows[0].name,
                roomType: roomData.rows[0].room_type,
                checkIn: check_in,
                checkOut: check_out,
                agentName: agent_name
            });
        }

        res.status(201).json({ success: true, data: booking.rows[0] });
    } catch (err) {
        console.error('Error booking room:', err);
        res.status(500).json({ success: false, error: 'Failed to book room' });
    }
};
