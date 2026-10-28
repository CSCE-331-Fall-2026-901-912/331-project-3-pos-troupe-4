const pool = require('./db');

//GETTERS

async function getInventory() {
    const result = await pool.query(
        `SELECT item_name, amount
         FROM inventory
         ORDER BY item_name ASC`
    );

    return result.rows;
}

// Grabs all active products from the Products table, along with their constituent items from Products_Items
async function getMenuItems() {
    try {
        //get menu items
        const productResult = await pool.query(
            'SELECT Product_Name, Price FROM Products ORDER BY Product_Name ASC'
        );

        const products = productResult.rows.map(rows => ({
            name: rows.product_name,
            price: Number(rows.price),
            constituentItems: []
        }));

        //map each product to corresponding object
        const productMap = new Map(
            products.map(product => [product.name, product])
        );

        //get constituent items
        const ingredientResult = await pool.query(
            'SELECT Product_Name, Item_Name FROM Products_Items ORDER BY Product_Name, Item_Name'
        )

        //link them
        for(const row of ingredientResult.rows) {
            const product = productMap.get(row.product_name);
            if(product && row.item_name != null) {
                product.constituentItems.push(row.item_name);
            }
        }

        return products;

    } catch(err) {
        console.error('Error fetching nemu items: ', err);
        throw err;
    }
}

// Grabs all items marked is_addable = true from the Items table that are currently in stock (amount > 0)
async function getAddableItems() {
    try {
        const result = await pool.query(
            `SELECT i.item_name FROM items i
            LEFT JOIN inventory inv ON LOWER(i.item_name) = LOWER(inv.item_name)
            WHERE i.is_addable = true AND COALESCE(inv.amount, 0) > 0
            ORDER BY i.item_name ASC`
        );

        return result.rows.map(row => row.item_name);

    } catch(err) {
        console.error('Error getting addable items: ', err);
        throw err;
    }
}

// Grabs all inventory item names from the Items table
async function getAllItemNames() {
    try {
        const result = await pool.query(
            `SELECT item_name FROM items ORDER BY item_name ASC`
        );

        return result.rows.map(row => row.item_name);

    } catch(err) {
        console.error('Error fetching all item names: ', err);
        throw err;
    }
}

async function getConstituentItemsForProduct(productName) {
    try {
        const result = await pool.query(
            `SELECT item_name FROM products_items WHERE LOWER(product_name) = LOWER($1) ORDER BY item_name ASC`,
            [productName]
        );

        return result.rows.map(row => row.item_name);

    } catch(err) {
        console.error('Error fetching constituent items: ', err);
        throw err;
    }
}

async function getLowStockItems() {
    try {
        const result = await pool.query(
            `SELECT * FROM inventory WHERE amount < 50`
        );

        return result.rows;

    } catch(err) {
        console.error('Error fetching low stock items: ', err);
        throw err;
    }
}

//get daily info for sales report
async function getSalesReport(startDate, endDate) {
    try {
        const result = await pool.query(
            `SELECT
                op.product_name AS product_name,
                COUNT(op.product_name) AS units_sold,
                ROUND(SUM(p.price), 2) AS total_sales
             FROM order_history oh
             JOIN orders_products op ON oh.order_id = op.order_id
             JOIN products p ON op.product_name = p.product_name
             WHERE oh.date_time >= $1::date
               AND oh.date_time < ($2::date + INTERVAL '1 day')
             GROUP BY op.product_name
             ORDER BY units_sold DESC`,
            [startDate, endDate]
        );

        return result.rows;
    } catch (err) {
        console.error('Error fetching sales report:', err);
        throw err;
    }
}

//SETTERS

//note: manager is BOOL
async function addEmployee(employeeName, manager, password) {
    try {
        const result = await pool.query(
            `INSERT INTO employees (employee_name, isManager, password)
            VALUES ($1, $2, $3)`,
            [employeeName, manager, password]
        );

    } catch(err) {
        console.error('Error adding employee: ', err);
        throw err;
    }
}

async function removeEmployee(employeeID) {
    try {
        const result = await pool.query(
            `DELETE FROM employees
            WHERE employee_id = $1`,
            [employeeID]
        );

    } catch(err) {
        console.error('Error removing employee: ', err);
        throw err;
    }
}

async function addProduct(productName, price) {
    try {
        const result = await pool.query(
            `INSERT INTO products (product_name, price)
            VALUES ($1, $2)`,
            [productName, price]
        );

    } catch(err) {
        console.error('Error adding product: ', err);
        throw err;
    }
}

async function removeProduct(productName) {
    try {
        await pool.query(
            `DELETE FROM products_items
            WHERE product_name = $1`,
            [productName]
        );

        await pool.query(
            `DELETE FROM products
            WHERE product_name = $1`,
            [productName]
        );

    } catch(err) {
        console.error('Error removing employee: ', err);
        throw err;
    }
}

async function addItem(itemName, supplierPricePerUnit, isAddable) {
    try {
        await pool.query(
            `INSERT INTO items (item_name, price, is_addable)
            VALUES ($1, $2, $3)`,
            [itemName, supplierPricePerUnit, isAddable]
        );

    } catch(err) {
        console.error('Error adding item: ', err);
        throw err;
    }
}

async function removeItem(itemName) {
    try {
        await pool.query(
            `DELETE FROM items
            WHERE item_name = $1`,
            [itemName]
        );

        await pool.query(
            `DELETE FROM inventory
            WHERE item_name = $1`,
            [itemName]
        );

    } catch(err) {
        console.error('Error adding item: ', err);
        throw err;
    }
}

//adds inevntory item: requires one db transaction to ensure that they succeed or fail together
async function addInventoryItem(itemName, initialStock, supplierCost, isAddable) {
    if (!itemName || !itemName.trim()) {
        return false;
    }

    const name = itemName.trim();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query(
        `INSERT INTO items (item_name, price, is_addable)
        VALUES ($1, $2, $3)
        ON CONFLICT (item_name)
        DO UPDATE SET
            price = EXCLUDED.price,
            is_addable = EXCLUDED.is_addable`,
        [name, supplierCost, isAddable]
        );

        await client.query(
        `INSERT INTO inventory (item_name, amount)
        VALUES ($1, $2)
        ON CONFLICT (item_name)
        DO UPDATE SET amount = EXCLUDED.amount`,
        [name, initialStock]
        );

        await client.query('COMMIT');
        return true;

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding inventory item:', error);
        throw error;

    } finally {
        client.release();
    }
}

//adds a complete new menu item
async function addProductWithItems(productName, price, constituentItems, newItemsStock) {

}

async function setProductConstituents(

) {

}

async function placeOrder(

) {

}



//BY FUNCTION

async function getManagerData() {
    const [inventory, products] = await Promise.all([
        getInventory(),
        getMenuItems()
    ]);

    return {
        inventory,
        products,
        dbName: process.env.PSQL_DATABASE || 'troupe_04_db',
        dbHost: process.env.PSQL_HOST || 'csce-315-db.engr.tamu.edu'
    };
}

module.exports = {
    // Getters
    getInventory,
    getMenuItems,
    getAddableItems,
    getAllItemNames,
    getConstituentItemsForProduct,
    getLowStockItems,
    getSalesReport,

    // Setters
    addEmployee,
    removeEmployee,
    addProduct,
    removeProduct,
    addItem,
    removeItem,
    addInventoryItem,
    addProductWithItems,
    setProductConstituents,
    placeOrder,

    // Screen-level data
    getManagerData
};