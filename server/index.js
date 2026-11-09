const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { requireAuth, requireManager } = require('./middleware/auth');

const express = require('express');
const pool = require('./db');
const Model = require('./Model');

const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const PgSession = require('connect-pg-simple')(session);

const app = express();
const port = process.env.PORT || 3000;

// Session configuration
if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET is missing from server/.env');
}

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.use(session({
    store: new PgSession({
        pool: pool,
        tableName: 'user_sessions',
        createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 8
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Configure GitHub OAuth
passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: process.env.GITHUB_CALLBACK_URL
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Match GitHub's verified account ID to an existing employee
                const employee = await Model.getEmployeeByGithubId(profile.id);

                if (!employee) {
                    return done(null, false);
                }

                return done(null, employee);
            } catch (err) {
                return done(err);
            }
        }
    )
);

// Store employee ID in the session
passport.serializeUser((employee, done) => {
    done(null, employee.employee_id);
});

// Reload employee information from the database
passport.deserializeUser(async (employeeId, done) => {
    try {
        const employee = await Model.getEmployeeById(employeeId);
        done(null, employee || false);
    } catch (err) {
        done(err);
    }
});

app.use(express.json());

// Start GitHub login
app.get('/api/auth/github', (req, res, next) => {
    const mode = req.query.mode;

    if (!['manager', 'cashier'].includes(mode)) {
        return res.status(400).json({ error: 'Invalid login mode' });
    }

    req.session.loginMode = mode;

    req.session.save((err) => {
        if (err) {
            return next(err);
        }

        passport.authenticate('github', {
            scope: ['read:user']
        })(req, res, next);
    });
});

// GitHub OAuth callback
app.get(
    '/api/auth/github/callback',
    passport.authenticate('github', {
        failureRedirect: '/?login=denied',
        keepSessionInfo: true
    }),
    (req, res) => {
      
        const mode = req.session.loginMode;
        delete req.session.loginMode;

        // Manager dashboard requires manager permissions
        if (mode === 'manager' && !req.user.is_manager) {
            return req.logout(() => {
                res.redirect('/?login=forbidden');
            });
        }

        // Redirect to the selected dashboard
        const frontendUrl = process.env.FRONTEND_URL || '';

        if (mode === 'manager') {
            return res.redirect(`${frontendUrl}/manager`);
        }

        return res.redirect(`${frontendUrl}/cashier`);
    }
);

// Check current login status
app.get('/api/auth/me', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json({
        employeeId: req.user.employee_id,
        employeeName: req.user.employee_name,
        isManager: req.user.is_manager
    });
});

// Logout
app.post('/api/auth/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);

        req.session.destroy((err) => {
            if (err) return next(err);

            res.clearCookie('connect.sid');
            res.json({ success: true });
        });
    });
});

app.get('/api/orders_products', requireManager, async (req, res) => {
  try {
    const { order_id } = req.query;
    const data = await Model.getOrderProducts(order_id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Failed to load product names'
    });
  }
});

// GET order_history between two dates (or most recent if dates omitted)
app.get('/api/order_history', requireManager, async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    const data = await Model.getOrderHistory(startDate, endDate, limit);
    res.json(data);
  } catch (err) {
    console.error('Failed to load order_history:', err);
    res.status(500).json({
      error: 'Failed to load order_history'
    });
  }
});

// GET ManagerView data
app.get('/api/manager', requireManager, async (req, res) => {
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
  try {
    const data = await Model.getMenuItems();
    res.json(data);
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({
      error: 'Failed to load menu items'
    });
  }
});


// GET addable items
app.get('/api/addable-items', async (req, res) => {
  try {
    const data = await Model.getAddableItems();
    res.json(data);
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({
      error: 'Failed to load addable items'
    });
  }
});


// GET low stock items
app.get('/api/inventory/low-stock', requireManager, async (req, res) => {
  try {
    const data = await Model.getLowStockItems();
    res.json(data);
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({
      error: 'Failed to load low stock items'
    });
  }
});


// GET sales report
app.get('/api/salesReport', requireManager, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const data = await Model.getSalesReport(startDate, endDate);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Failed to load sales report'
    });
  }
});

// GET full inventory
app.get('/api/inventory', requireManager, async (req, res) => {
    try {
        const data = await Model.getInventory();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load inventory' });
    }
});

// Update inventory stock
app.put('/api/inventory/:itemName', requireManager, async (req, res) => {
    try {
        const { itemName } = req.params;
        const { amount } = req.body;
        await Model.updateInventoryStock(itemName, amount);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update inventory stock' });
    }
});

// GET inventory usage chart
app.get('/api/reports/inventory-usage', requireManager, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const data = await Model.getInventoryUsage(startDate, endDate);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load inventory usage report' });
    }
});

// GET X-Report
app.get('/api/reports/x-report', requireManager, async (req, res) => {
    try {
        const { date } = req.query;
        const data = await Model.getXReport(date);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load X-Report' });
    }
});

// GET employees
app.get('/api/employees', requireManager, async (req, res) => {
    try {
        const data = await Model.getEmployees();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load employees' });
    }
});

// Update employee
app.put('/api/employees/:employeeId', requireManager, async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { employeeName, isManager, password } = req.body;
        await Model.updateEmployee(employeeId, employeeName, isManager, password);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update employee' });
    }
});

// GET all items TODO- should this be auth protected?
app.get('/api/items', requireManager, async (req, res) => {
    try {
        const data = await Model.getItems();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load items' });
    }
});

// GET product constituent items
app.get('/api/products/:name/constituents', requireManager, async (req, res) => {
    try {
        const { name } = req.params;
        const data = await Model.getConstituentItemsForProduct(name);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load product constituent items' });
    }
});

// Update product price
app.put('/api/products/:productName', requireManager, async (req, res) => {
    try {
        const { productName } = req.params;
        const { price } = req.body;
        await Model.updateProductPrice(productName, price);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update product price' });
    }
});


//add inventory item
app.post('/api/inventory', requireManager, async (req, res) => {
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
app.post('/api/employees', requireManager, async (req, res) => {
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
app.delete('/api/employees/:employeeId', requireManager, async (req, res) => {
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
app.post('/api/products', requireManager, async (req, res) => {
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
app.delete('/api/products/:productName', requireManager, async (req, res) => {
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
app.post('/api/items', requireManager, async (req, res) => {
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
app.delete('/api/items/:itemName', requireManager, async (req, res) => {
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
app.post('/api/products/complete', requireManager, async (req, res) => {
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
app.put('/api/products/:name/constituents', requireManager, async (req, res) => {
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
