const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();
const path = require('path');

// Create express app
const app = express();
const port = process.env.PORT || 3000;

// Serve static assets (CSS, static files, and hosted Javadoc)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/docs', express.static(path.join(__dirname, 'public', 'docs')));

// Configure PostgreSQL connection pool using environment variables
const pool = new Pool({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: process.env.PSQL_PORT || 5432,
    ssl: { rejectUnauthorized: false }
});

// Add process hook to gracefully shutdown pool on SIGINT (Ctrl+C)
process.on('SIGINT', function() {
    pool.end();
    console.log('\nApplication successfully shutdown. Database pool closed.');
    process.exit(0);
});

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route: Home page
app.get('/', (req, res) => {
    const data = { name: 'Joshua' };
    res.render('index', data);
});

// Route: Team members page (queries PostgreSQL teammembers table)
app.get('/user', (req, res) => {
    pool
        .query('SELECT * FROM teammembers ORDER BY id ASC;')
        .then(query_res => {
            const teammembers = query_res.rows;
            console.log(`[GET /user] Retrieved ${teammembers.length} team members from PostgreSQL:`);
            console.log(teammembers);
            res.render('user', { teammembers: teammembers });
        })
        .catch(err => {
            console.error('[GET /user] Database query error:', err);
            res.status(500).send('Database Error: ' + err.message);
        });
});

// Route: POS Products page (queries PostgreSQL products table)
app.get('/products', (req, res) => {
    pool
        .query('SELECT product_name, price FROM products ORDER BY product_name ASC;')
        .then(query_res => {
            const products = query_res.rows;
            console.log(`[GET /products] Retrieved ${products.length} products from PostgreSQL.`);
            res.render('products', { products: products });
        })
        .catch(err => {
            console.error('[GET /products] Database query error:', err);
            res.status(500).send('Database Error: ' + err.message);
        });
});

// Start the HTTP server
app.listen(port, () => {
    console.log(`====================================================`);
    console.log(`CSCE 331 Express Server listening at http://localhost:${port}`);
    console.log(`Database connected to: ${process.env.PSQL_USER}@${process.env.PSQL_HOST}/${process.env.PSQL_DATABASE}`);
    console.log(`Code documentation hosted at: http://localhost:${port}/docs`);
    console.log(`====================================================`);
});
