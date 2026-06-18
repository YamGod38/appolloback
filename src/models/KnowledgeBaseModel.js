const db = require('../config/db');

class KnowledgeBaseModel {
    static async search(query) {
        try {
            const sql = `
                SELECT * FROM knowledge_base
                WHERE title ILIKE $1 OR content ILIKE $1 OR $2 = ANY(tags)
                LIMIT 5
            `;
            const { rows } = await db.query(sql, [`%${query}%`, query.toLowerCase()]);
            return rows;
        } catch (error) {
            console.error('KB Search Error:', error);
            throw error;
        }
    }
}
module.exports = KnowledgeBaseModel;
