// Test database connection directly without Prisma
require('dotenv').config();
const mariadb = require('mariadb');

const config = {
  host: process.env.DATABASE_HOST || '127.0.0.1',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectTimeout: 10000,
  allowPublicKeyRetrieval: true,  // Required for MySQL 8
};

console.log('Testing connection with config:', {
  ...config,
  password: '****'
});

async function testConnection() {
  let conn;
  try {
    conn = await mariadb.createConnection(config);
    console.log('Connected successfully!');

    const rows = await conn.query('SELECT 1 as test');
    console.log('Query result:', rows);

    const users = await conn.query('SELECT COUNT(*) as count FROM users');
    console.log('Users count:', users);

  } catch (err) {
    console.error('Connection failed:', err.message);
    console.error('Error code:', err.code);
    console.error('Full error:', err);
  } finally {
    if (conn) {
      await conn.end();
      console.log('Connection closed');
    }
  }
}

testConnection();
