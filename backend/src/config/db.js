const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'rmadmin',
  password: process.env.DB_PASSWORD || 'rmpassword',
  database: process.env.DB_NAME || 'railway_maintenance',
});

pool.on('connect', () => console.log('✅ Connected to PostgreSQL'));
pool.on('error', (err) => console.error('❌ PostgreSQL error:', err));

module.exports = pool;
