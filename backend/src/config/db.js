// Database configuration and connection setup using pg (PostgreSQL) in Node.js
const { Pool } = require('pg');

// Create a new pool instance with the connection string and SSL configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Handle unexpected errors on the database connection pool
pool.on('error', (err) => {
  console.error('Unexpected DB error:', err);
  process.exit(-1);
});

module.exports = pool;
