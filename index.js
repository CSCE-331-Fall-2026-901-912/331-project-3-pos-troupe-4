const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

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

// Root Route: Queries live inventory and menu products from PostgreSQL
app.get('/', async (req, res) => {
    try {
        const inventoryResult = await pool.query('SELECT item_name, amount FROM inventory ORDER BY item_name ASC;');
        const productResult = await pool.query('SELECT product_name, price FROM products ORDER BY product_name ASC;');
        
        res.render('index', {
            inventory: inventoryResult.rows,
            products: productResult.rows,
            dbName: process.env.PSQL_DATABASE || 'troupe_04_db',
            dbHost: process.env.PSQL_HOST || 'csce-315-db.engr.tamu.edu'
        });
    } catch (err) {
        console.error('Database connection error:', err);
        res.status(500).send('Database connection error: ' + err.message);
    }
});

// /user route matching lecture slide demonstration
app.get('/user', (req, res) => {
    pool.query('SELECT * FROM teammembers ORDER BY id ASC;')
        .then(query_res => {
            res.render('user', { teammembers: query_res.rows });
        })
        .catch(err => {
            console.error('Database error on /user:', err);
            res.status(500).send('Database error: ' + err.message);
        });
});

app.listen(port, () => {
    console.log(`Express server running at http://localhost:${port}`);
    console.log(`Connected to database: ${process.env.PSQL_DATABASE}@${process.env.PSQL_HOST}`);
});
