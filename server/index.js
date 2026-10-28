require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const pool = require('./db');
const Model = require('./Model');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// ManagerView data
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