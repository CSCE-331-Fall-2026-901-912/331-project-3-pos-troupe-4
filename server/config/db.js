const { Pool } = require('pg');

// Configure PostgreSQL connection pool
const pool = new Pool({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: process.env.PSQL_PORT || 5432,
    ssl: { rejectUnauthorized: false }
});

process.on('SIGINT', function() {
    pool.end();
    console.log('Database pool closed. Server shutdown.');
    process.exit(0);
});