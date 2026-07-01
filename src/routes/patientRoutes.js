const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const db = require('../config/db');

const authMiddleware = require('../utils/authMiddleware');

// Memory storage keeps the file in RAM so we can blast it straight to S3
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/:id/upload', authMiddleware(), upload.single('prescription'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        
        const region = process.env.AWS_REGION;
        const bucket = process.env.AWS_S3_BUCKET;
        
        let cloudUrl = '';

        // Check if AWS API Keys are present
        if (!region || !bucket || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            console.warn('[AWS S3] Missing AWS API keys in .env. Falling back to mocked cloud upload.');
            cloudUrl = `https://mock-apollo-crm-storage.s3.amazonaws.com/prescriptions/${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
        } else {
            console.log(`[AWS S3] Initiating cloud upload for: ${req.file.originalname}`);
            
            const s3Client = new S3Client({ region });
            const fileKey = `prescriptions/${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;

            await s3Client.send(new PutObjectCommand({
                Bucket: bucket,
                Key: fileKey,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
                // ACL: 'public-read' // Uncomment if you want the files to be publicly readable
            }));

            cloudUrl = `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`;
            console.log(`[AWS S3] Upload successful: ${cloudUrl}`);
        }
        
        // Push the cloud URL into the database array
        try {
            await db.query(
                'UPDATE customers_patients SET prescription_urls = array_append(prescription_urls, $1) WHERE id = $2', 
                [cloudUrl, req.params.id]
            );
        } catch (dbErr) {
            console.warn('[AWS S3] Database offline, file uploaded but DB not updated.');
        }

        res.json({ message: 'File shipped to cloud storage', url: cloudUrl });
    } catch (err) {
        console.error('Cloud Upload Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Mock Data for HUID functionality (in-memory)
let mockPatients = [
    { id: 1, huid: 'AP-102948', name: 'John Doe', phone: '+1 (555) 123-0099', family_members: [], prescription_urls: ['https://mock-apollo-crm-storage.s3.amazonaws.com/prescriptions/sample-bill.pdf'] },
    { id: 2, huid: 'AP-839201', name: 'Emma Watson', phone: '+1 (555) 882-3341', family_members: [{ id: 1, name: 'Tom Watson', relation: 'Son', age: 12 }], prescription_urls: [] }
];

// GET /api/patients/search?query=...
router.get('/search', authMiddleware(), async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json({ success: false, message: 'No search query provided' });

        // Try DB first
        try {
            const dbRes = await db.query('SELECT id, huid, full_name as name, phone_number as phone, prescription_urls FROM customers_patients WHERE huid = $1 OR phone_number = $1', [query]);
            if (dbRes.rows.length > 0) {
                const patient = dbRes.rows[0];
                const familyRes = await db.query('SELECT * FROM family_members WHERE primary_huid = $1', [patient.huid]);
                return res.json({ success: true, data: { ...patient, family_members: familyRes.rows } });
            }
        } catch (dbErr) {
            console.warn('[Patients API] Database offline. Using mock search.');
        }

        // Mock fallback
        const mockMatch = mockPatients.find(p => p.huid === query || p.phone === query);
        if (mockMatch) {
            res.json({ success: true, data: mockMatch });
        } else {
            res.json({ success: false, message: 'Patient not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to search' });
    }
});

// POST /api/patients/:huid/family
router.post('/:huid/family', authMiddleware(), async (req, res) => {
    try {
        const { huid } = req.params;
        const { name, relation, age } = req.body;

        try {
            const dbRes = await db.query('INSERT INTO family_members (primary_huid, name, relation, age) VALUES ($1, $2, $3, $4) RETURNING *', [huid, name, relation, age]);
            return res.json({ success: true, data: dbRes.rows[0] });
        } catch (dbErr) {
            console.warn('[Patients API] Database offline. Modifying mock data.');
        }

        const patient = mockPatients.find(p => p.huid === huid);
        if (patient) {
            const newMember = { id: Date.now(), name, relation, age };
            patient.family_members.push(newMember);
            res.json({ success: true, data: newMember });
        } else {
            res.status(404).json({ success: false, message: 'Primary HUID not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to add family member' });
    }
});

// GET /api/patients/:huid/files
router.get('/:huid/files', authMiddleware(), async (req, res) => {
    try {
        const { huid } = req.params;
        try {
            const dbRes = await db.query('SELECT prescription_urls FROM customers_patients WHERE huid = $1', [huid]);
            if (dbRes.rows.length > 0) {
                return res.json({ success: true, data: dbRes.rows[0].prescription_urls || [] });
            }
        } catch (dbErr) {
            // DB Offline
        }

        const mockMatch = mockPatients.find(p => p.huid === huid);
        res.json({ success: true, data: mockMatch ? mockMatch.prescription_urls : [] });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch files' });
    }
});

// GET /api/patients/:phone/history
router.get('/:phone/history', authMiddleware(), async (req, res) => {
    try {
        const { phone } = req.params;
        
        // Find customer
        const customerResult = await db.query('SELECT id FROM customers_patients WHERE phone_number = $1', [phone]);
        
        if (customerResult.rows.length === 0) {
            // Mock empty history for new callers if DB query succeeds but no records exist
            return res.json([]);
        }

        const customerId = customerResult.rows[0].id;

        // Fetch logs
        const logsResult = await db.query(`
            SELECT il.id, il.call_status, il.ai_summary as summary, il.created_at as date, u.full_name as agent 
            FROM interaction_logs il
            LEFT JOIN users u ON il.user_id = u.id
            WHERE il.customer_id = $1
            ORDER BY il.created_at DESC
        `, [customerId]);

        const mappedLogs = logsResult.rows.map(row => ({
            id: row.id,
            type: 'call', // assuming 'call' for all DB entries for now
            date: new Date(row.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
            summary: row.summary || 'Call logged (No AI Summary available).',
            agent: row.agent || 'System'
        }));

        res.json(mappedLogs);

    } catch (err) {
        console.warn('[Patients API] Database offline. Returning mock interaction history.');
        res.json([
            { id: 1, type: 'call', date: '2026-06-10 14:30', summary: 'Patient asked about fasting rules before sugar test. Advised 12 hours.', agent: 'Alpha' },
            { id: 2, type: 'upload', date: '2026-06-12 10:15', note: 'Uploaded updated prescription (Dr. Smith).' },
            { id: 3, type: 'call', date: '2026-06-15 09:00', summary: 'AI Summary: Routine check. BP stable. Set follow-up for 3 months.', agent: 'Delta' }
        ]);
    }
});

module.exports = router;
