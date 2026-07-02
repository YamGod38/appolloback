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
        origin: '*', // Allow all origins for the websocket to easily connect from Netlify
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const jwt = require('jsonwebtoken');
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        return next(new Error('Authentication error: Token missing'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error('Authentication error: Invalid token'));
        socket.user = decoded;
        next();
    });
});

app.set('io', io);
app.set('globalCallRouting', 'live'); // 'live', 'forward', 'offline'

// Mock Live Agent States
let agents = [
    { id: 1, name: 'Agent Alpha', status: 'Online' },
    { id: 2, name: 'Agent Beta', status: 'Offline' },
    { id: 3, name: 'Agent Gamma', status: 'Break' },
    { id: 4, name: 'Agent Delta', status: 'Online' }
];

// Mock Live Doctors State
let doctors = [
    { id: 'd1', name: 'Dr. Sarah Chen', spec: 'Cardiology', status: 'Available' },
    { id: 'd2', name: 'Dr. Marcus Thorne', spec: 'Neurology', status: 'In Surgery' },
    { id: 'd3', name: 'Dr. Emily Ross', spec: 'Orthopedics', status: 'Available' },
    { id: 'd4', name: 'Dr. James Wilson', spec: 'General Practice', status: 'Off Duty' }
];

// Live Diagnostic Scans Configuration
let scanTypes = [
    { id: 'mri', name: 'MRI Scan', prep: 'Fasting 4 hours prior. Remove all metal objects.', duration: '45 mins' },
    { id: 'ct', name: 'CT Scan', prep: 'Clear liquid diet. Contrast dye may be used.', duration: '30 mins' },
    { id: 'xray', name: 'X-Ray', prep: 'No special preparation needed.', duration: '15 mins' },
    { id: 'usg', name: 'Ultrasound', prep: 'Drink 1 liter of water 1 hour before.', duration: '20 mins' }
];

let attendanceLogs = [];
let recentBookings = [];
let recentHotelBookings = [];
let recentScanBookings = [];
let allBookings = []; // Unified list for Reception feed
let missedCalls = []; // In-memory missed calls queue
let adminMemo = "MRI Room B is undergoing scheduled maintenance until 2:00 PM. Route all acute trauma to Room A.";
app.set('missedCalls', missedCalls);

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
    socket.emit('SCAN_TYPES_SYNC', scanTypes);
    socket.emit('ROUTING_STATE_SYNC', app.get('globalCallRouting'));
    socket.emit('ADMIN_MEMO_SYNC', adminMemo);

    // Provide state on demand for late-mounting components
    socket.on('GET_INITIAL_STATE', () => {
        socket.emit('AGENT_STATUS_UPDATE', agents);
        socket.emit('DOCTOR_STATUS_SYNC', doctors);
        socket.emit('SCAN_TYPES_SYNC', scanTypes);
        socket.emit('ATTENDANCE_LOG_SYNC', attendanceLogs);
        socket.emit('BOOKING_SYNC', recentBookings);
        socket.emit('HOTEL_BOOKING_SYNC', recentHotelBookings);
        socket.emit('SCAN_BOOKING_SYNC', recentScanBookings);
        socket.emit('ALL_BOOKINGS_SYNC', allBookings);
        socket.emit('ROUTING_STATE_SYNC', app.get('globalCallRouting'));
        socket.emit('ADMIN_MEMO_SYNC', adminMemo);
    });

    // Listen for admin updating routing state
    socket.on('UPDATE_ROUTING_STATE', (state) => {
        app.set('globalCallRouting', state);
        io.emit('ROUTING_STATE_SYNC', state);
        console.log(`[Socket] Global routing state updated to: ${state}`);
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

    // Listen for agent status updates
    socket.on('UPDATE_AGENT_STATUS', async ({ name, status }) => {
        const agentIndex = agents.findIndex(a => a.name === name);
        if (agentIndex !== -1) {
            agents[agentIndex].status = status;
        } else {
            agents.push({ id: Date.now(), name, status });
        }
        io.emit('AGENT_STATUS_UPDATE', agents);
        console.log(`[Socket] Agent ${name} status updated to ${status}`);

        // Log this status change to attendance_logs
        try {
            await db.pool.query(
                'INSERT INTO attendance_logs (agent_name, action, timestamp) VALUES ($1, $2, $3)',
                [name, status, new Date().toISOString()]
            );
            
            // Also maintain in-memory array for instant sync on widget
            const log = { id: Date.now(), agentName: name, action: status, timestamp: new Date().toISOString() };
            attendanceLogs.unshift(log);
            if (attendanceLogs.length > 50) attendanceLogs.pop();
            io.emit('ATTENDANCE_LOG_SYNC', attendanceLogs);
        } catch (err) {
            console.error('Failed to log agent status change to DB', err);
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

    // Listen for adding a new scan type
    socket.on('ADD_SCAN_TYPE', (newScan) => {
        const scan = {
            id: `scan_${Date.now()}`,
            name: newScan.name,
            prep: newScan.prep,
            duration: newScan.duration
        };
        scanTypes.push(scan);
        io.emit('SCAN_TYPES_SYNC', scanTypes);
        console.log(`[Socket] New scan type added: ${scan.name}`);
    });

    // Listen for removing a scan type
    socket.on('REMOVE_SCAN_TYPE', (id) => {
        scanTypes = scanTypes.filter(s => s.id !== id);
        io.emit('SCAN_TYPES_SYNC', scanTypes);
        console.log(`[Socket] Scan type removed: ${id}`);
    });

    // Listen for Admin Memo Updates
    socket.on('UPDATE_ADMIN_MEMO', (memo) => {
        adminMemo = memo;
        io.emit('ADMIN_MEMO_SYNC', adminMemo);
        console.log(`[Socket] Admin Memo updated: ${memo}`);
    });

    // --- NEW: Admin Tracking Events --- //
    // Emit initial states
    socket.emit('ATTENDANCE_LOG_SYNC', attendanceLogs);
    socket.emit('BOOKING_SYNC', recentBookings);
    socket.emit('HOTEL_BOOKING_SYNC', recentHotelBookings);
    socket.emit('SCAN_BOOKING_SYNC', recentScanBookings);
    socket.emit('ALL_BOOKINGS_SYNC', allBookings);
    socket.emit('MISSED_CALLS_SYNC', missedCalls);

    socket.on('AGENT_CLOCK_IN', async (data) => {
        // data: { agentName: 'Agent Alpha', action: 'Clocked In' | 'Clocked Out', timestamp: ISO }
        try {
            await db.pool.query(
                'INSERT INTO attendance_logs (agent_name, action, timestamp) VALUES ($1, $2, $3)',
                [data.agentName, data.action, data.timestamp]
            );
            
            // Also maintain in-memory array for instant sync
            const log = { id: Date.now(), ...data };
            attendanceLogs.unshift(log); // Add to beginning
            if (attendanceLogs.length > 50) attendanceLogs.pop(); // Keep last 50
            io.emit('ATTENDANCE_LOG_SYNC', attendanceLogs);
            console.log(`[Socket] ${data.agentName} ${data.action}`);
        } catch (err) {
            console.error('Failed to log attendance to DB', err);
        }
    });

    socket.on('BOOKING_MADE', (data) => {
        // data: { patientName: 'John Doe', doctor: 'dr_smith', date: '...', time: '...' }
        const booking = { id: Date.now(), type: 'APPOINTMENT', status: 'Pending', ...data };
        recentBookings.unshift(booking);
        if (recentBookings.length > 50) recentBookings.pop();
        io.emit('BOOKING_SYNC', recentBookings);

        allBookings.unshift(booking);
        if (allBookings.length > 100) allBookings.pop();
        io.emit('ALL_BOOKINGS_SYNC', allBookings);
        
        console.log(`[Socket] New appointment booking for ${data.patientName}`);
    });

    socket.on('HOTEL_BOOKING_MADE', (data) => {
        // data: { patientName: 'John Doe', hotel: 'The Grand', roomType: '...', checkIn: '...', checkOut: '...' }
        const booking = { id: Date.now(), type: 'HOTEL', status: 'Pending', ...data };
        recentHotelBookings.unshift(booking);
        if (recentHotelBookings.length > 50) recentHotelBookings.pop();
        io.emit('HOTEL_BOOKING_SYNC', recentHotelBookings);

        allBookings.unshift(booking);
        if (allBookings.length > 100) allBookings.pop();
        io.emit('ALL_BOOKINGS_SYNC', allBookings);

        console.log(`[Socket] New hotel booking for ${data.patientName}`);
    });

    socket.on('SCAN_BOOKING_MADE', (data) => {
        const booking = { id: Date.now(), type: 'SCAN', status: 'Pending', ...data };
        recentScanBookings.unshift(booking);
        if (recentScanBookings.length > 50) recentScanBookings.pop();
        io.emit('SCAN_BOOKING_SYNC', recentScanBookings);

        allBookings.unshift(booking);
        if (allBookings.length > 100) allBookings.pop();
        io.emit('ALL_BOOKINGS_SYNC', allBookings);

        console.log(`[Socket] New scan booking for ${data.patientName}: ${data.scanType}`);
    });

    socket.on('VERIFY_BOOKING', async (id) => {
        const booking = allBookings.find(b => b.id === id);
        if (booking) {
            booking.status = 'Verified';
            io.emit('ALL_BOOKINGS_SYNC', allBookings);
            console.log(`[Socket] Booking ${id} verified.`);
            
            // Sync last_visited to database
            if (booking.huid || booking.number) {
                try {
                    let query = 'UPDATE customers_patients SET last_visited = CURRENT_DATE WHERE ';
                    let params = [];
                    if (booking.huid) {
                        query += 'huid = $1';
                        params.push(booking.huid);
                    } else if (booking.number) {
                        query += 'phone_number = $1';
                        params.push(booking.number);
                    }
                    await db.pool.query(query, params);
                    console.log(`[Socket] Synced last_visited for patient: ${booking.patientName}`);
                } catch (err) {
                    console.error('Failed to sync last_visited:', err);
                }
            }
        }
    });

    socket.on('ADD_MISSED_CALL', (data) => {
        const call = { id: Date.now(), ...data, status: 'Pending', timestamp: new Date().toISOString() };
        missedCalls.push(call);
        app.set('missedCalls', missedCalls);
        io.emit('MISSED_CALLS_SYNC', missedCalls);
        console.log(`[Socket] New missed call queued from ${data.callerNumber}`);
    });

    socket.on('PROCESS_MISSED_CALL', (callId) => {
        const call = missedCalls.find(c => c.id === callId);
        if (call) {
            call.status = 'In Progress';
            app.set('missedCalls', missedCalls);
            io.emit('MISSED_CALLS_SYNC', missedCalls);
            console.log(`[Socket] Missed call ${callId} is now In Progress`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Dashboard disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Backend server blasting on port ${PORT}`);
});
