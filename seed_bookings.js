require('dotenv').config();
const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 1, role: 'ADMIN' }, process.env.JWT_SECRET || 'supersecret_apollo_key', { expiresIn: '1h' });

const socket = io('http://localhost:5000', { auth: { token } });

socket.on('connect', () => {
    console.log('Connected to socket server. Seeding bookings...');

    // 1. Appointment Booking
    socket.emit('BOOKING_MADE', {
        patientName: 'Rahul Sharma',
        huid: 'AP-102948',
        doctor: 'Dr. Ramesh Gupta',
        date: new Date().toISOString().slice(0,10),
        time: '10:30 AM',
        agentName: 'Agent Alpha'
    });

    // 2. Scan Booking
    socket.emit('SCAN_BOOKING_MADE', {
        patientName: 'Anjali Desai',
        huid: 'AP-482910',
        number: '+91 87654 32109',
        scanType: 'MRI Scan',
        date: new Date().toISOString().slice(0,10),
        time: '11:00 AM',
        agentName: 'Agent Alpha'
    });

    // 3. Hotel Booking
    socket.emit('HOTEL_BOOKING_MADE', {
        patientName: 'Karthik Iyer',
        hotel: 'The Grand',
        roomType: 'Executive Suite',
        checkIn: new Date().toISOString().slice(0,10),
        checkOut: new Date(Date.now() + 86400000 * 2).toISOString().slice(0,10),
        agentName: 'Agent Alpha'
    });

    console.log('Bookings seeded.');
    
    setTimeout(() => {
        socket.disconnect();
        process.exit(0);
    }, 1000);
});

socket.on('connect_error', (err) => {
    console.error('Connection error:', err);
    process.exit(1);
});
