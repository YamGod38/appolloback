const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' }); // Adjust if needed, but normally dotenv looks at root if started from there.

// Actually better to just require dotenv in server.js before anything else.
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
