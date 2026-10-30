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

// Adds a product and links its constituent items
async function addProductWithItems(
    productName,
    price,
    constituentItems,
    newItemsStock = null
) {
    if (!productName || !productName.trim()) {
        return false;
    }

    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
        return false;
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const trimmedName = productName.trim();

        // 1. Insert or update product
        await client.query(
            `INSERT INTO products (product_name, price)
             VALUES ($1, $2)
             ON CONFLICT (product_name)
             DO UPDATE SET price = EXCLUDED.price`,
            [trimmedName, price]
        );

        // 2. Process constituent items
        if (Array.isArray(constituentItems)) {
            for (const itemName of constituentItems) {
                if (!itemName || !itemName.trim()) continue;

                const trimmedItem = itemName.trim();

                // Check if item already exists
                const checkResult = await client.query(
                    `SELECT COUNT(*)
                     FROM items
                     WHERE LOWER(item_name) = LOWER($1)`,
                    [trimmedItem]
                );

                const exists = Number(checkResult.rows[0].count) > 0;

                // 3. Create missing item and inventory record
                if (!exists) {
                    const stockAmt =
                        newItemsStock?.[trimmedItem] ?? 100;

                    await client.query(
                        `INSERT INTO items
                            (item_name, price, is_addable)
                         VALUES ($1, 0.25, false)
                         ON CONFLICT DO NOTHING`,
                        [trimmedItem]
                    );

                    await client.query(
                        `INSERT INTO inventory (item_name, amount)
                         VALUES ($1, $2)
                         ON CONFLICT (item_name)
                         DO UPDATE SET amount = EXCLUDED.amount`,
                        [trimmedItem, stockAmt]
                    );
                }

                // 4. Link item to product
                await client.query(
                    `INSERT INTO products_items
                        (item_name, product_name)
                     VALUES ($1, $2)
                     ON CONFLICT DO NOTHING`,
                    [trimmedItem, trimmedName]
                );
            }
        }

        await client.query('COMMIT');
        return true;

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error adding product with items:', err);
        return false;

    } finally {
        client.release();
    }
}

// Replaces constituent items for an existing product
async function setProductConstituentItems(productName, constituentItems) {
    if (!productName || !productName.trim()) {
        return false;
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const trimmedName = productName.trim();

        // Remove existing constituent items
        await client.query(
            `DELETE FROM products_items
             WHERE LOWER(product_name) = LOWER($1)`,
            [trimmedName]
        );

        // Insert new constituent items
        if (Array.isArray(constituentItems)) {
            for (const item of constituentItems) {
                if (!item || !item.trim()) continue;

                await client.query(
                    `INSERT INTO products_items
                        (item_name, product_name)
                     VALUES ($1, $2)
                     ON CONFLICT DO NOTHING`,
                    [item.trim(), trimmedName]
                );
            }
        }

        await client.query('COMMIT');
        return true;

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating constituent items:', err);
        return false;

    } finally {
        client.release();
    }
}

// Saves order details, records add-ins, and updates inventory
async function placeOrder(order) {
    if (!order || !Array.isArray(order.items) || order.items.length === 0) {
        console.error('Cannot process checkout with null or empty cart!');
        return false;
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Default invalid/guest employee IDs to 0
        const employeeId = order.employeeId < 0 ? 0 : order.employeeId;
        const customerName = order.customerName || 'Guest';

        // A. Insert order history record
        const orderResult = await client.query(
            `INSERT INTO order_history
                (employee_id, total_price, customer_name, date_time)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             RETURNING order_id`,
            [employeeId, order.totalPrice, customerName]
        );

        const orderId = orderResult.rows[0].order_id;

        // B. Insert products, add-ins, and deduct inventory
        for (const product of order.items) {

            // Link product to order
            await client.query(
                `INSERT INTO orders_products (order_id, product_name)
                 VALUES ($1, $2)`,
                [orderId, product.productName]
            );

            // Record additions in add_ins
            if (Array.isArray(product.selectAddOns)) {
                for (const custom of product.selectAddOns) {
                    if (custom.isAddition) {
                        await client.query(
                            `INSERT INTO add_ins (order_id, item_name)
                             SELECT $1, $2
                             WHERE EXISTS (
                                 SELECT 1 FROM items
                                 WHERE LOWER(item_name) = LOWER($2)
                             )`,
                            [orderId, custom.itemName]
                        );
                    }
                }
            }

            // Deduct inventory for each final constituent item
            if (Array.isArray(product.finalConstituentItems)) {
                for (const ingredient of product.finalConstituentItems) {
                    if (!ingredient || !ingredient.trim()) continue;

                    await client.query(
                        `UPDATE inventory
                         SET amount = GREATEST(0, amount - 1)
                         WHERE LOWER(item_name) = LOWER($1)`,
                        [ingredient.trim()]
                    );
                }
            }
        }

        await client.query('COMMIT');

        console.log(`Order #${orderId} saved successfully!`);
        return true;

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error saving order:', err);
        return false;

    } finally {
        client.release();
    }
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
    setProductConstituentItems,
    placeOrder,
    

    // Screen-level data
    getManagerData
};