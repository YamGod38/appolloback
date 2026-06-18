require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const db = require('./src/config/db');
require('./src/services/cronJobs'); // Spin up the Cron Jobs

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

app.set('io', io);

// Mock Live Agent States
let agents = [
    { id: 1, name: 'Agent Alpha', status: 'Available' },
    { id: 2, name: 'Agent Beta', status: 'Offline' },
    { id: 3, name: 'Agent Gamma', status: 'On Call' },
    { id: 4, name: 'Agent Delta', status: 'Available' }
];

// Mock Live Doctors State
let doctors = [
    { id: 'd1', name: 'Dr. Sarah Chen', spec: 'Cardiology', status: 'Available' },
    { id: 'd2', name: 'Dr. Marcus Thorne', spec: 'Neurology', status: 'In Surgery' },
    { id: 'd3', name: 'Dr. Emily Ross', spec: 'Orthopedics', status: 'Available' },
    { id: 'd4', name: 'Dr. James Wilson', spec: 'General Practice', status: 'Off Duty' }
];

// Memory states for Admin Tracking
let attendanceLogs = [];
let recentBookings = [];

db.pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring Postgres client.', err.message);
    }
    console.log('Postgres DB connected successfully.');
    release();
});

io.on('connection', (socket) => {
    console.log(`Dashboard connected to WebSockets: ${socket.id}`);
    
    // Blast initial state to dashboard on connect
    socket.emit('AGENT_STATUS_UPDATE', agents);
    socket.emit('DOCTOR_STATUS_SYNC', doctors);

    // Provide state on demand for late-mounting components
    socket.on('GET_INITIAL_STATE', () => {
        socket.emit('AGENT_STATUS_UPDATE', agents);
        socket.emit('DOCTOR_STATUS_SYNC', doctors);
        socket.emit('ATTENDANCE_LOG_SYNC', attendanceLogs);
        socket.emit('BOOKING_SYNC', recentBookings);
    });

    // Listen for admin updating doctor status
    socket.on('UPDATE_DOCTOR_STATUS', ({ id, status }) => {
        const docIndex = doctors.findIndex(d => d.id === id);
        if (docIndex !== -1) {
            doctors[docIndex].status = status;
            io.emit('DOCTOR_STATUS_SYNC', doctors);
            console.log(`[Socket] Doctor ${id} status updated to ${status}`);
        }
    });

    // Listen for adding a new doctor
    socket.on('ADD_DOCTOR', (newDoctor) => {
        const doc = {
            id: `d${Date.now()}`,
            name: newDoctor.name,
            spec: newDoctor.spec,
            status: 'Available'
        };
        doctors.push(doc);
        io.emit('DOCTOR_STATUS_SYNC', doctors);
        console.log(`[Socket] New doctor added: ${doc.name}`);
    });

    // Listen for removing a doctor
    socket.on('REMOVE_DOCTOR', (id) => {
        doctors = doctors.filter(d => d.id !== id);
        io.emit('DOCTOR_STATUS_SYNC', doctors);
        console.log(`[Socket] Doctor removed: ${id}`);
    });

    // --- NEW: Admin Tracking Events --- //
    // Emit initial states
    socket.emit('ATTENDANCE_LOG_SYNC', attendanceLogs);
    socket.emit('BOOKING_SYNC', recentBookings);

    socket.on('AGENT_CLOCK_IN', (data) => {
        // data: { agentName: 'Agent Alpha', action: 'Clocked In' | 'Clocked Out', timestamp: ISO }
        const log = { id: Date.now(), ...data };
        attendanceLogs.unshift(log); // Add to beginning
        if (attendanceLogs.length > 50) attendanceLogs.pop(); // Keep last 50
        io.emit('ATTENDANCE_LOG_SYNC', attendanceLogs);
        console.log(`[Socket] ${data.agentName} ${data.action}`);
    });

    socket.on('BOOKING_MADE', (data) => {
        // data: { patientName: 'John Doe', doctor: 'dr_smith', date: '...', time: '...' }
        const booking = { id: Date.now(), ...data };
        recentBookings.unshift(booking);
        if (recentBookings.length > 50) recentBookings.pop();
        io.emit('BOOKING_SYNC', recentBookings);
        console.log(`[Socket] New booking for ${data.patientName}`);
    });

    socket.on('disconnect', () => {
        console.log(`Dashboard disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Backend server blasting on port ${PORT}`);
});
