const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const pool = require('./db');
const Model = require('./Model');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// GET ManagerView data
app.get('/api/manager', async (req, res) => {
    try {
        const data = await Model.getManagerData();
        res.json(data);
    } catch (err) {
        console.error('Database connection error:', err);
        res.status(500).json({
            error: 'Failed to load manager data'
        });
    }
});

// GET menu
app.get('/api/menu', async (req, res) => {
    try{
        const data = await Model.getMenuItems();
        res.json(data);
    } catch(err) {
        console.error('Database connection error:', err);
        res.status(500).json({
            error: 'Failed to load menu items'
        });
    }
});


// GET addable items
app.get('/api/addable-items', async (req, res) => {
    try{
        const data = await Model.getAddableItems();
        res.json(data);
    } catch(err) {
        console.error('Database connection error:', err);
        res.status(500).json({
            error: 'Failed to load addable items'
        });
    }
});


// GET low stock items
app.get('/api/inventory/low-stock', async (req, res) => {
    try{
        const data = await Model.getLowStockItems();
        res.json(data);
    } catch(err) {
        console.error('Database connection error:', err);
        res.status(500).json({
            error: 'Failed to load low stock items'
        });
    }
});


// GET sales report
app.get('/api/salesReport', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const data = await Model.getSalesReport(startDate, endDate);
        res.json(data);
    } catch(err) {
        console.error(err);
        res.status(500).json({
            error: 'Failed to load sales report'
        });
    }
});

//add inventory item
app.post('/api/inventory', async (req, res) => {
    try {
        const { itemName, initialStock, supplierCost, isAddable } = req.body;

        const success = await Model.addInventoryItem(
            itemName,
            initialStock,
            supplierCost,
            isAddable
        );

        if (!success) {
            return res.status(400).json({ error: 'Invalid item name' });
        }

        res.status(201).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add inventory item' });
    }
});

//add employee
app.post('/api/employees', async (req, res) => {
    try {
        const { employeeName, manager, password } = req.body;

        const success = await Model.addEmployee(
            employeeName, manager, password
        );

        if (!success) {
            return res.status(400).json({ error: 'Invalid employee name' });
        }

        res.status(201).json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add employee' });
    }
});

//remove employee
app.delete('/api/employees/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;

        const success = await Model.removeEmployee(
            employeeId
        );

        if (!success) {
            return res.status(400).json({ error: 'Invalid employee ID' });
        }

        res.status(200).json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to remove employee' });
    }
});

//add product
app.post('/api/products', async (req, res) => {
    try {
        const { productName, price } = req.body;

        const success = await Model.addProduct(
            productName, price
        );

        if (!success) {
            return res.status(400).json({ error: 'Invalid product name' });
        }

        res.status(201).json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

//remove product
app.delete('/api/products/:productName', async (req, res) => {
    try {
        const { productName } = req.params;

        const success = await Model.removeProduct(
            productName
        );

        if (!success) {
            return res.status(400).json({ error: 'Invalid product name' });
        }

        res.status(200).json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to remove product' });
    }
});

//add item
app.post('/api/items', async (req, res) => {
    try {
        const { itemName, supplierPricePerUnit, isAddable } = req.body;

        const success = await Model.addItem(
            itemName, supplierPricePerUnit, isAddable
        );

        if (!success) {
            return res.status(400).json({ error: 'Invalid item name' });
        }

        res.status(201).json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add item' });
    }
});

//remove item
app.delete('/api/items/:itemName', async (req, res) => {
    try {
        const { itemName } = req.params;

        const success = await Model.removeItem(
            itemName
        );

        if (!success) {
            return res.status(400).json({ error: 'Invalid item name' });
        }

        res.status(200).json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to remove item' });
    }
});

// add product with constituent items
app.post('/api/products/complete', async (req, res) => {
    try {
        const {
            productName,
            price,
            constituentItems,
            newItemsStock
        } = req.body;

        const success = await Model.addProductWithItems(
            productName,
            price,
            constituentItems,
            newItemsStock
        );

        if (!success) {
            return res.status(400).json({
                error: 'Failed to add product with items'
            });
        }

        res.status(201).json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Failed to add product with items'
        });
    }
});


// Update product constituents
app.put('/api/products/:name/constituents', async (req, res) => {
    try {
        const { name } = req.params;
        const { constituentItems } = req.body;

        if (!Array.isArray(constituentItems)) {
            return res.status(400).json({
                error: 'Constituent items must be an array'
            });
        }

        const success = await Model.setProductConstituentItems(
            name,
            constituentItems
        );

        if (!success) {
            return res.status(400).json({
                error: 'Failed to update product constituents'
            });
        }

        res.status(200).json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Failed to update product constituents'
        });
    }
});

// Place order
app.post('/api/orders', async (req, res) => {
    try {
        const success = await Model.placeOrder(req.body);

        if (!success) {
            return res.status(400).json({
                error: 'Failed to place order'
            });
        }

        res.status(201).json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Failed to place order'
        });
    }
});

// Serve static frontend assets built by Vite
const distPath = path.join(__dirname, '../dist');
const indexHtmlPath = path.join(distPath, 'index.html');
app.use(express.static(distPath));

// Fallback all non-API GET routes to index.html for React Router SPA
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        if (fs.existsSync(indexHtmlPath)) {
            return res.sendFile(indexHtmlPath);
        } else {
            return res.status(200).send('API server running. Build the frontend with `npm run build` to view the UI.');
        }
    }
    next();
});

const server = app.listen(port, () => {
    console.log(`Express server running on port ${port}`);
    console.log(
        `Configured database: ${process.env.PSQL_DATABASE}@${process.env.PSQL_HOST}`
    );
    console.log(
        `Frontend build status: ${fs.existsSync(indexHtmlPath) ? 'FOUND dist/index.html' : 'MISSING dist/index.html'} at ${indexHtmlPath}`
    );
});

let shuttingDown = false;

async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;

    server.close(async () => {
        try {
            await pool.end();
            console.log('Database pool closed. Server shutdown.');
            process.exit(0);
        } catch (err) {
            console.error('Error closing database pool:', err);
            process.exit(1);
        }
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);