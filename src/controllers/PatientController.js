const db = require('../config/db');

const PatientController = {
    // Get all patients with optional search
    getPatients: async (req, res) => {
        try {
            const { q } = req.query;
            let query = `
                SELECT cp.*, COUNT(fm.id) as family_count 
                FROM customers_patients cp
                LEFT JOIN family_members fm ON cp.huid = fm.primary_huid
            `;
            let params = [];

            if (q) {
                query += ' WHERE cp.full_name ILIKE $1 OR cp.phone_number ILIKE $1 OR cp.huid ILIKE $1 OR cp.email ILIKE $1';
                params = [`%${q}%`];
            }
            query += ' GROUP BY cp.id ORDER BY cp.created_at DESC';

            const result = await db.query(query, params);
            // Convert family_count from string to integer (pg returns COUNT as string)
            const rows = result.rows.map(r => ({ ...r, family_count: parseInt(r.family_count || 0) }));
            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('[PatientController] Error fetching patients:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch patients' });
        }
    },

    // Create a new patient profile
    createPatient: async (req, res) => {
        try {
            const { 
                full_name, phone_number, email, dob, 
                gender, blood_group, weight, height, 
                allergies, chronic_conditions, 
                emergency_contact_name, emergency_contact_phone, address, last_visited
            } = req.body;
            
            // Generate a unique HUID (Hospital Unique ID)
            const huid = 'AP-' + Math.floor(100000 + Math.random() * 900000);

            const result = await db.query(
                'INSERT INTO customers_patients (huid, full_name, phone_number, email, dob, gender, blood_group, weight, height, allergies, chronic_conditions, emergency_contact_name, emergency_contact_phone, address, last_visited) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *',
                [
                    huid, full_name, phone_number, email, dob || null, 
                    gender, blood_group, weight, height, 
                    allergies, chronic_conditions, emergency_contact_name, 
                    emergency_contact_phone, address, last_visited || null
                ]
            );

            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('[PatientController] Error creating patient:', error);
            res.status(500).json({ success: false, error: 'Failed to create patient profile' });
        }
    },

    // Update an existing patient profile
    updatePatient: async (req, res) => {
        try {
            const { huid } = req.params;
            const { 
                full_name, phone_number, email, dob, 
                gender, blood_group, weight, height, 
                allergies, chronic_conditions, 
                emergency_contact_name, emergency_contact_phone, address, last_visited
            } = req.body;

            const result = await db.query(
                `UPDATE customers_patients SET 
                    full_name = $1, phone_number = $2, email = $3, dob = $4, 
                    gender = $5, blood_group = $6, weight = $7, height = $8, 
                    allergies = $9, chronic_conditions = $10,
                    emergency_contact_name = $11,
                    emergency_contact_phone = $12,
                    address = $13,
                    last_visited = $14,
                    updated_at = CURRENT_TIMESTAMP 
                WHERE huid = $15 RETURNING *`,
                [
                    full_name, phone_number, email, dob || null,
                    gender, blood_group, weight, height,
                    allergies, chronic_conditions,
                    emergency_contact_name, emergency_contact_phone, address, last_visited || null,
                    huid
                ]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Patient not found' });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('[PatientController] Error updating patient:', error);
            res.status(500).json({ success: false, error: 'Failed to update patient profile' });
        }
    },

    // Delete a patient profile
    deletePatient: async (req, res) => {
        try {
            const { huid } = req.params;
            
            const result = await db.query(
                'DELETE FROM customers_patients WHERE huid = $1 RETURNING *',
                [huid]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Patient not found' });
            }

            res.json({ success: true, message: 'Patient profile deleted successfully' });
        } catch (error) {
            console.error('[PatientController] Error deleting patient:', error);
            res.status(500).json({ success: false, error: 'Failed to delete patient profile' });
        }
    },

    // --- Family Member Management ---

    getFamily: async (req, res) => {
        try {
            const { huid } = req.params;
            const result = await db.query('SELECT * FROM family_members WHERE primary_huid = $1 ORDER BY created_at ASC', [huid]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('[PatientController] Error fetching family:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch family members' });
        }
    },

    addFamilyMember: async (req, res) => {
        try {
            const { huid } = req.params;
            const { name, relation, age } = req.body;
            
            const result = await db.query(
                'INSERT INTO family_members (primary_huid, name, relation, age) VALUES ($1, $2, $3, $4) RETURNING *',
                [huid, name, relation, age]
            );
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('[PatientController] Error adding family member:', error);
            res.status(500).json({ success: false, error: 'Failed to add family member' });
        }
    },

    deleteFamilyMember: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await db.query('DELETE FROM family_members WHERE id = $1 RETURNING *', [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Family member not found' });
            }
            res.json({ success: true, message: 'Family member removed' });
        } catch (error) {
            console.error('[PatientController] Error deleting family member:', error);
            res.status(500).json({ success: false, error: 'Failed to delete family member' });
        }
    }
};

module.exports = PatientController;
