const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is missing in .env');
    process.exit(1);
}
class AuthController {
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            
            // Live Database Query
            try {
                const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
                
                if (result.rows.length === 0) {
                    return res.status(401).json({ error: 'Invalid credentials. User not found.' });
                }

                const user = result.rows[0];

                // Validate password securely via bcrypt
                const isValidPassword = await bcrypt.compare(password, user.password_hash);
                if (!isValidPassword) {
                    return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
                }
                
                // Issue JWT
                const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
                
                return res.json({ 
                    token, 
                    role: user.role, 
                    name: user.full_name 
                });
            } catch (dbError) {
                // FALLBACK FOR DEMO IF POSTGRES IS OFFLINE
                console.log('[Auth] Database offline. Falling back to mock credentials.');
                if (email === 'admin@apollo.com' && password === 'admin') {
                    const token = jwt.sign({ id: 1, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '12h' });
                    return res.json({ token, role: 'ADMIN', name: 'Admin User' });
                }
                if (email === 'agent@apollo.com' && password === 'agent') {
                    const token = jwt.sign({ id: 2, role: 'AGENT' }, JWT_SECRET, { expiresIn: '12h' });
                    return res.json({ token, role: 'AGENT', name: 'Agent Alpha' });
                }
                return res.status(401).json({ error: 'Invalid credentials. DB Offline. Use admin@apollo.com / admin' });
            }

        } catch (error) {
            console.error('[Auth Error]', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    static async register(req, res) {
        try {
            // Verify Admin Token
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) return res.status(401).json({ error: 'Unauthorized. No token provided.' });
            
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                if (decoded.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden. Only Admins can create accounts.' });
            } catch (err) {
                return res.status(401).json({ error: 'Invalid token.' });
            }

            const { firstName, lastName, email, role, skills } = req.body;
            if (!email || !firstName || !lastName) return res.status(400).json({ error: 'Missing required fields' });

            const defaultPassword = 'changeme123';
            const passwordHash = await bcrypt.hash(defaultPassword, 10);
            const fullName = `${firstName} ${lastName}`;
            const userRole = role || 'USER';

            // Insert into DB if online
            try {
                await db.query(
                    'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4)',
                    [email, passwordHash, fullName, userRole]
                );
                return res.json({ message: 'User provisioned successfully', email, defaultPassword });
            } catch (dbError) {
                console.log('[Auth] DB Offline, mocking successful account creation for demo');
                return res.json({ message: 'User provisioned successfully (Mock)', email, defaultPassword });
            }
        } catch (error) {
            console.error('[Auth Error]', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async requestReset(req, res) {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ error: 'Email is required' });

            // Store reset request in DB if online
            try {
                // Assuming a reset_requests table exists, or just mock it
                await db.query(
                    'INSERT INTO reset_requests (email, status) VALUES ($1, $2)',
                    [email, 'PENDING']
                );
                return res.json({ message: 'Password reset request submitted successfully. The Admin has been notified.' });
            } catch (dbError) {
                console.log('[Auth] DB Offline, mocking successful reset request for demo');
                return res.json({ message: 'Password reset request submitted successfully (Mock). The Admin has been notified.' });
            }
        } catch (error) {
            console.error('[Auth Error]', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = AuthController;
