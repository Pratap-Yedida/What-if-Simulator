// Quick database connection test
// Run with: node check-db.js

require('dotenv').config();

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 
  `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${process.env.SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '')}.supabase.co:5432/postgres`;

console.log('Testing database connection...');
console.log('Connection string:', connectionString.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

pool.query('SELECT NOW() as time, COUNT(*) as user_count FROM users')
  .then(result => {
    console.log('\n✅ Database connection successful!');
    console.log('Time:', result.rows[0].time);
    console.log('User count:', result.rows[0].user_count);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Database connection failed!');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Detail:', error.detail);
    console.error('Hint:', error.hint);
    process.exit(1);
  });

