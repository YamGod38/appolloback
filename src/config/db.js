const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' }); // Adjust if needed, but normally dotenv looks at root if started from there.

// Actually better to just require dotenv in server.js before anything else.
// Handle either a connection string (DATABASE_URL) or individual vars
const poolConfig = process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Neon and Render hosted DBs
} : {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
};

const pool = new Pool(poolConfig);

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
