
const pool = require('./db');

async function getInventory() {
    const result = await pool.query(
        `SELECT item_name, amount
         FROM inventory
         ORDER BY item_name ASC`
    );

    return result.rows;
}

async function getProducts() {
    const result = await pool.query(
        `SELECT product_name, price
         FROM products
         ORDER BY product_name ASC`
    );

    return result.rows;
}

async function getManagerData() {
    const [inventory, products] = await Promise.all([
        getInventory(),
        getProducts()
    ]);

    return {
        inventory,
        products,
        dbName: process.env.PSQL_DATABASE || 'troupe_04_db',
        dbHost: process.env.PSQL_HOST || 'csce-315-db.engr.tamu.edu'
    };
}

module.exports = {
    getInventory,
    getProducts,
    getManagerData
};
