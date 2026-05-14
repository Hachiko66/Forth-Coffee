const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'forth_coffee',
  user: process.env.DB_USER || 'forth_master',
  password: process.env.DB_PASS || 'ForthMaster2025Secure',
  port: 5432
});
module.exports = pool;
