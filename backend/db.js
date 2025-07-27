// backend/db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // 針對 Neon 這類雲端資料庫
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1); // 應用程式異常終止
});

module.exports = pool;