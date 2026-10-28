require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const pool = require('./db');
const Model = require('./Model');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// get ManagerView data
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

const server = app.listen(port, () => {
    console.log(`Express server running on port ${port}`);
    console.log(
        `Configured database: ${process.env.PSQL_DATABASE}@${process.env.PSQL_HOST}`
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