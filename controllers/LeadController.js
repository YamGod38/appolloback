const db = require('../config/db');

exports.getLeads = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM leads ORDER BY created_at DESC');
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching leads:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch leads' });
    }
};

exports.createLead = async (req, res) => {
    const { name, email, phone, status, source, notes, assigned_to } = req.body;
    try {
        const query = `
            INSERT INTO leads (name, email, phone, status, source, notes, assigned_to)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const result = await db.query(query, [name, email, phone, status || 'New', source, notes, assigned_to]);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error creating lead:', err);
        res.status(500).json({ success: false, error: 'Failed to create lead' });
    }
};

exports.updateLead = async (req, res) => {
    const { id } = req.params;
    const { status, notes, assigned_to } = req.body;
    try {
        const query = `
            UPDATE leads
            SET status = COALESCE($1, status),
                notes = COALESCE($2, notes),
                assigned_to = COALESCE($3, assigned_to),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *;
        `;
        const result = await db.query(query, [status, notes, assigned_to, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Lead not found' });
        }
        
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error updating lead:', err);
        res.status(500).json({ success: false, error: 'Failed to update lead' });
    }
};

exports.deleteLead = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM leads WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Lead not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.error('Error deleting lead:', err);
        res.status(500).json({ success: false, error: 'Failed to delete lead' });
    }
};
