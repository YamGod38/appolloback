const db = require('../config/db');

class CustomerModel {
    static async findByPhoneNumber(phoneNumber) {
        try {
            if (!phoneNumber) return null;
            // Strip any leading +91 or 0 for uniform search
            const cleanNumber = phoneNumber.replace(/^\+91|^0/, '');
            
            const query = `
                SELECT * FROM customers_patients 
                WHERE phone_number LIKE $1 
                LIMIT 1
            `;
            const { rows } = await db.query(query, [`%${cleanNumber}`]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error fetching customer by phone:', error);
            throw error;
        }
    }
}

module.exports = CustomerModel;
