import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getManagerData,
  getInventory,
  updateInventoryStock,
  addInventoryItem,
  getLowStockItems,
  getMenuItems,
  addProduct,
  updateProductPrice,
  removeProduct,
  setProductConstituentItems,
  addProductWithItems,
  getEmployees,
  addEmployee,
  updateEmployee,
  removeEmployee,
  getXReport,
  getSalesReport,
  getInventoryUsage,
  getOrderHistory,
  getItems
} from '../api';
import './ManagerPage.css';

// Format hour integer (0-23) as 12-hour timestamp (e.g. 5:00 PM)
function formatHourTime(hourInt) {
  const h = Number(hourInt);
  if (isNaN(h)) return String(hourInt);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:00 ${period}`;
}

// Normalize hourly series so that all operating hours are present (defaulting missing hours to 0)
function normalizeHourlyData(rawList, valKey) {
  const dataMap = new Map();
  if (Array.isArray(rawList)) {
    rawList.forEach((item) => {
      const h = Number(item.hour);
      if (!isNaN(h)) {
        dataMap.set(h, Number(item[valKey]) || 0);
      }
    });
  }

  // Operating window: at least 8:00 AM to 10:00 PM (8 to 22), or broader if data exists outside that
  const existingHours = Array.from(dataMap.keys());
  const minHour = existingHours.length > 0 ? Math.min(8, ...existingHours) : 8;
  const maxHour = existingHours.length > 0 ? Math.max(22, ...existingHours) : 22;

  const result = [];
  for (let h = minHour; h <= maxHour; h++) {
    result.push({
      hour: h,
      time_label: formatHourTime(h),
      [valKey]: dataMap.has(h) ? dataMap.get(h) : 0,
    });
  }
  return result;
}

// Reusable SVG Bar Chart component for reports
function SvgBarChart({
  data,
  xKey,
  yKey,
  title,
  yLabel,
  barColor = '#2E6F5E',
  height = 240,
  slantLabels = false,
}) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-header">{title}</div>
        <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: '2rem 0', textAlign: 'center' }}>
          No data available for the selected time window.
        </p>
      </div>
    );
  }

  // If slantLabels is enabled, increase bottom padding and total height so labels never overlap
  const padding = {
    top: 28,
    right: 24,
    bottom: slantLabels ? 95 : 45,
    left: 60,
  };
  const chartHeight = slantLabels ? height + 60 : height;
  const colWidth = slantLabels ? 56 : 46;
  const width = Math.max(620, data.length * colWidth + padding.left + padding.right);

  const values = data.map((d) => Number(d[yKey]) || 0);
  const maxVal = Math.max(...values, 1);
  const availablePlotHeight = chartHeight - padding.top - padding.bottom;

  return (
    <div className="chart-container">
      <div className="chart-header">{title}</div>
      <div className="chart-svg-wrapper">
        <svg width={width} height={chartHeight} style={{ overflow: 'visible', display: 'block' }}>
          {/* Y Axis Guide Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const yPos = padding.top + (1 - ratio) * availablePlotHeight;
            const labelVal = Math.round(maxVal * ratio);
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={yPos}
                  x2={width - padding.right}
                  y2={yPos}
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748b"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((item, idx) => {
            const val = Number(item[yKey]) || 0;
            const barH = (val / maxVal) * availablePlotHeight;
            const slotWidth = (width - padding.left - padding.right) / data.length;
            const barW = Math.max(16, slotWidth * 0.62);
            const xPos = padding.left + idx * slotWidth + (slotWidth - barW) / 2;
            const yPos = chartHeight - padding.bottom - barH;

            const labelRaw = String(item[xKey] ?? '');
            // For slanted, allow full label up to 26 chars; for non-slanted truncate at 12 chars
            const labelDisplay = slantLabels
              ? (labelRaw.length > 26 ? labelRaw.slice(0, 24) + '…' : labelRaw)
              : (labelRaw.length > 12 ? labelRaw.slice(0, 10) + '..' : labelRaw);

            const labelX = xPos + barW / 2;
            const labelY = chartHeight - padding.bottom + (slantLabels ? 12 : 16);

            return (
              <g key={idx}>
                <rect
                  x={xPos}
                  y={yPos}
                  width={barW}
                  height={Math.max(barH, val > 0 ? 2 : 0)}
                  fill={barColor}
                  rx="3"
                >
                  <title>{`${labelRaw}: ${val}`}</title>
                </rect>
                {val > 0 && (
                  <text
                    x={xPos + barW / 2}
                    y={yPos - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="#334155"
                  >
                    {val}
                  </text>
                )}
                <text
                  x={labelX}
                  y={labelY}
                  transform={slantLabels ? `rotate(-42, ${labelX}, ${labelY})` : undefined}
                  textAnchor={slantLabels ? 'end' : 'middle'}
                  fontSize="11"
                  fontWeight="500"
                  fill="#475569"
                >
                  <title>{labelRaw}</title>
                  {labelDisplay}
                </text>
              </g>
            );
          })}

          {/* Bottom axis line */}
          <line
            x1={padding.left}
            y1={chartHeight - padding.bottom}
            x2={width - padding.right}
            y2={chartHeight - padding.bottom}
            stroke="#94a3b8"
          />
        </svg>
      </div>
    </div>
  );
}

export default function ManagerPage() {
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  // System metadata
  const [dbName, setDbName] = useState('troupe_04_db');
  const [dbHost, setDbHost] = useState('csce-315-db.engr.tamu.edu');

  // Tab 1: X-Report
  const [xReportDate, setXReportDate] = useState('2026-10-29');
  const [xReport, setXReport] = useState(null);

  // Tab 2: Inventory Usage
  const [usageStart, setUsageStart] = useState('2026-09-01');
  const [usageEnd, setUsageEnd] = useState('2026-09-10');
  const [usageData, setUsageData] = useState([]);

  // Tab 3: Sales Report
  const [salesStart, setSalesStart] = useState('2026-09-01');
  const [salesEnd, setSalesEnd] = useState('2026-09-10');
  const [salesData, setSalesData] = useState([]);

  // Tab 4: Inventory Management
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [invSearch, setInvSearch] = useState('');
  const [selectedInvItem, setSelectedInvItem] = useState({ item_name: '', amount: '' });
  const [newInvForm, setNewInvForm] = useState({ name: '', stock: 100, cost: 0.25, isAddable: false });

  // Tab 5: Menu & Employees
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState({ id: '', name: '', isManager: false, password: '' });
  const [newEmpForm, setNewEmpForm] = useState({ name: '', isManager: false, password: '' });

  const [products, setProducts] = useState([]);
  const [selectedProd, setSelectedProd] = useState({ name: '', price: '', constituentItems: [] });
  const [newProdForm, setNewProdForm] = useState({ name: '', price: '' });

  // Recipe & Seasonal Item Modals
  const [allItems, setAllItems] = useState([]);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [editingRecipeProd, setEditingRecipeProd] = useState('');
  const [modalSelectedItems, setModalSelectedItems] = useState([]);
  const [recipeSearch, setRecipeSearch] = useState('');

  const [isSeasonalModalOpen, setIsSeasonalModalOpen] = useState(false);
  const [seasonalForm, setSeasonalForm] = useState({ name: '', price: '5.50', stock: 100 });
  const [seasonalItems, setSeasonalItems] = useState([]);

  // Tab 6: Trends (Order History)
  const [orderHistory, setOrderHistory] = useState([]);
  const [orderLimit, setOrderLimit] = useState(25);

  // Initial Data Load
  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [mgrRes, xRes, usageRes, salesRes, itemsRes, historyRes] = await Promise.all([
        getManagerData(),
        getXReport('2026-10-29'),
        getInventoryUsage('2026-09-01', '2026-09-10'),
        getSalesReport('2026-09-01', '2026-09-10'),
        getItems(),
        getOrderHistory(null, null, 25)
      ]);

      setDbName(mgrRes.dbName);
      setDbHost(mgrRes.dbHost);
      setInventory(mgrRes.inventory || []);
      setProducts(mgrRes.products || []);
      setEmployees(mgrRes.employees || []);
      setLowStock(mgrRes.lowStock || []);
      setXReport(xRes);
      setUsageData(usageRes || []);
      setSalesData(salesRes || []);
      setAllItems(itemsRes.map(i => i.item_name) || []);
      setOrderHistory(historyRes || []);
    } catch (err) {
      console.error('Failed loading manager data:', err);
      showMessage('Error loading initial data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function showMessage(text, type = 'success') {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage({ text: '', type: '' });
    }, 4500);
  }

  // --- Handlers: X-Report ---
  async function handleLoadXReport(dateToLoad) {
    try {
      const data = await getXReport(dateToLoad);
      setXReport(data);
      showMessage(`X-Report loaded for ${dateToLoad}`);
    } catch (err) {
      showMessage('Failed to load X-Report: ' + err.message, 'error');
    }
  }

  // --- Handlers: Inventory ---
  async function handleUpdateStock(e) {
    e.preventDefault();
    if (!selectedInvItem.item_name) {
      showMessage('Please select an item to update.', 'error');
      return;
    }
    try {
      await updateInventoryStock(selectedInvItem.item_name, parseInt(selectedInvItem.amount) || 0);
      showMessage(`Updated stock for ${selectedInvItem.item_name}`);
      const [freshInv, freshLow] = await Promise.all([getInventory(), getLowStockItems()]);
      setInventory(freshInv);
      setLowStock(freshLow);
    } catch (err) {
      showMessage('Failed updating stock: ' + err.message, 'error');
    }
  }

  async function handleAddInventoryItem(e) {
    e.preventDefault();
    if (!newInvForm.name.trim()) return;
    try {
      await addInventoryItem(newInvForm.name, newInvForm.stock, newInvForm.cost, newInvForm.isAddable);
      showMessage(`Added new inventory item: ${newInvForm.name}`);
      setNewInvForm({ name: '', stock: 100, cost: 0.25, isAddable: false });
      const [freshInv, freshItems] = await Promise.all([getInventory(), getItems()]);
      setInventory(freshInv);
      setAllItems(freshItems.map(i => i.item_name));
    } catch (err) {
      showMessage('Failed to add item: ' + err.message, 'error');
    }
  }

  // --- Handlers: Employees ---
  async function handleUpdateEmployee(e) {
    e.preventDefault();
    if (!selectedEmp.id) return;
    try {
      await updateEmployee(selectedEmp.id, selectedEmp.name, selectedEmp.isManager, selectedEmp.password);
      showMessage(`Updated employee #${selectedEmp.id}`);
      const freshEmp = await getEmployees();
      setEmployees(freshEmp);
      setSelectedEmp({ id: '', name: '', isManager: false, password: '' });
    } catch (err) {
      showMessage('Failed to update employee: ' + err.message, 'error');
    }
  }

  async function handleAddEmployee(e) {
    e.preventDefault();
    if (!newEmpForm.name.trim()) return;
    try {
      await addEmployee(newEmpForm.name, newEmpForm.isManager, newEmpForm.password);
      showMessage(`Added employee: ${newEmpForm.name}`);
      setNewEmpForm({ name: '', isManager: false, password: '' });
      const freshEmp = await getEmployees();
      setEmployees(freshEmp);
    } catch (err) {
      showMessage('Failed to add employee: ' + err.message, 'error');
    }
  }

  async function handleRemoveEmployee(id) {
    if (!window.confirm(`Are you sure you want to remove employee #${id}?`)) return;
    try {
      await removeEmployee(id);
      showMessage(`Removed employee #${id}`);
      const freshEmp = await getEmployees();
      setEmployees(freshEmp);
      setSelectedEmp({ id: '', name: '', isManager: false, password: '' });
    } catch (err) {
      showMessage('Failed to remove employee: ' + err.message, 'error');
    }
  }

  // --- Handlers: Menu (Products) ---
  async function handleUpdateProductPrice(e) {
    e.preventDefault();
    if (!selectedProd.name) return;
    try {
      await updateProductPrice(selectedProd.name, parseFloat(selectedProd.price));
      showMessage(`Updated price for ${selectedProd.name}`);
      const freshProducts = await getMenuItems();
      setProducts(freshProducts);
    } catch (err) {
      showMessage('Failed to update product price: ' + err.message, 'error');
    }
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    if (!newProdForm.name.trim()) return;
    try {
      await addProduct(newProdForm.name, parseFloat(newProdForm.price) || 0);
      showMessage(`Added product: ${newProdForm.name}`);
      setNewProdForm({ name: '', price: '' });
      const freshProducts = await getMenuItems();
      setProducts(freshProducts);
      // Open recipe editor immediately for newly created product
      openRecipeModal(newProdForm.name, []);
    } catch (err) {
      showMessage('Failed to add product: ' + err.message, 'error');
    }
  }

  async function handleRemoveProduct(name) {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the menu?`)) return;
    try {
      await removeProduct(name);
      showMessage(`Removed product: ${name}`);
      const freshProducts = await getMenuItems();
      setProducts(freshProducts);
      setSelectedProd({ name: '', price: '', constituentItems: [] });
    } catch (err) {
      showMessage('Failed to remove product: ' + err.message, 'error');
    }
  }

  // --- Handlers: Recipe & Seasonal Item Modals ---
  function openRecipeModal(prodName, currentItems) {
    setEditingRecipeProd(prodName);
    setModalSelectedItems([...currentItems]);
    setIsRecipeModalOpen(true);
  }

  async function handleSaveRecipe() {
    try {
      await setProductConstituentItems(editingRecipeProd, modalSelectedItems);
      showMessage(`Saved recipe for ${editingRecipeProd}`);
      setIsRecipeModalOpen(false);
      const freshProducts = await getMenuItems();
      setProducts(freshProducts);
      if (selectedProd.name === editingRecipeProd) {
        setSelectedProd({ ...selectedProd, constituentItems: modalSelectedItems });
      }
    } catch (err) {
      showMessage('Failed to save recipe: ' + err.message, 'error');
    }
  }

  async function handleSaveSeasonalProduct() {
    if (!seasonalForm.name.trim()) return;
    try {
      await addProductWithItems(
        seasonalForm.name,
        parseFloat(seasonalForm.price) || 5.0,
        seasonalItems,
        parseInt(seasonalForm.stock) || 100
      );
      showMessage(`Successfully added seasonal item "${seasonalForm.name}" with recipe!`);
      setIsSeasonalModalOpen(false);
      setSeasonalForm({ name: '', price: '5.50', stock: 100 });
      setSeasonalItems([]);
      const freshProducts = await getMenuItems();
      setProducts(freshProducts);
    } catch (err) {
      showMessage('Failed to add seasonal item: ' + err.message, 'error');
    }
  }

  // --- Handlers: Sales & Usage Reports ---
  async function handleGenerateUsageReport() {
    try {
      const data = await getInventoryUsage(usageStart, usageEnd);
      setUsageData(data || []);
      showMessage('Inventory usage graph updated.');
    } catch (err) {
      showMessage('Failed to generate usage report: ' + err.message, 'error');
    }
  }

  async function handleGenerateSalesReport() {
    try {
      const data = await getSalesReport(salesStart, salesEnd);
      setSalesData(data || []);
      showMessage('Sales report updated.');
    } catch (err) {
      showMessage('Failed to generate sales report: ' + err.message, 'error');
    }
  }

  async function handleLoadOrderHistory() {
    try {
      const data = await getOrderHistory(null, null, orderLimit);
      setOrderHistory(data || []);
      showMessage(`Loaded latest ${orderLimit} orders.`);
    } catch (err) {
      showMessage('Failed to load orders: ' + err.message, 'error');
    }
  }

  if (loading) {
    return (
      <main className="manager-container">
        <div className="manager-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Loading Manager Dashboard...</h2>
          <p style={{ color: '#64748b' }}>Connecting to PostgreSQL database ({dbName})...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="manager-container">
      <div className="manager-shell">
        {/* Header */}
        <header className="manager-header">
          <div>
            <h1>Manager Dashboard</h1>
            <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' }}>
              CSCE 331 &bull; Troupe 04 POS System
            </div>
          </div>
          <div className="manager-status-badge">
            <span style={{ fontSize: '0.75rem' }}>●</span> Database: {dbName} ({dbHost})
          </div>
        </header>

        {/* Status Alerts */}
        {statusMessage.text && (
          <div
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontWeight: '600',
              fontSize: '0.92rem',
              backgroundColor: statusMessage.type === 'error' ? '#fee2e2' : '#dcfce7',
              color: statusMessage.type === 'error' ? '#991b1b' : '#166534',
              border: statusMessage.type === 'error' ? '1px solid #f87171' : '1px solid #86efac'
            }}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Tab Navigation (Exact 1:1 with Project 2 ManagerView) */}
        <nav className="manager-nav">
          <button
            className={`nav-tab-btn ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            Home (X-Report)
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'usage' ? 'active' : ''}`}
            onClick={() => setActiveTab('usage')}
          >
            Inventory Usage
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            Sales Report
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'menu_emp' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu_emp')}
          >
            Menu / Employees
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'trends' ? 'active' : ''}`}
            onClick={() => setActiveTab('trends')}
          >
            Trends (Orders)
          </button>
        </nav>

        {/* TAB 1: HOME (X-REPORT) */}
        {activeTab === 'home' && (
          <div>
            <div className="manager-card">
              <div className="card-title-row">
                <h2>Manager Dashboard: X-Report</h2>
              </div>

              {/* Controls bar: DatePicker and Today button */}
              <div className="controls-bar">
                <label>Report Date:</label>
                <input
                  type="date"
                  className="date-input"
                  value={xReportDate}
                  onChange={(e) => setXReportDate(e.target.value)}
                />
                <button
                  className="btn-primary"
                  onClick={() => handleLoadXReport(xReportDate)}
                >
                  Load Report
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setXReportDate(today);
                    handleLoadXReport('today');
                  }}
                >
                  Today (Current Day)
                </button>
              </div>

              {/* Summary KPI Cards */}
              <div className="kpi-grid">
                <div className="kpi-card purple">
                  <div className="kpi-title">Total Sales</div>
                  <div className="kpi-value">${xReport?.totalSales || '0.00'}</div>
                </div>
                <div className="kpi-card blue">
                  <div className="kpi-title">Total Transactions</div>
                  <div className="kpi-value">{xReport?.totalTransactions || 0}</div>
                </div>
                <div className="kpi-card green">
                  <div className="kpi-title">Average Transaction</div>
                  <div className="kpi-value">${xReport?.avgPricePerTransaction || '0.00'}</div>
                </div>
              </div>

              {/* Bar Charts */}
              <SvgBarChart
                data={normalizeHourlyData(xReport?.incomeByHour, 'total_income')}
                xKey="time_label"
                yKey="total_income"
                title="Income by Hour ($)"
                yLabel="Income ($)"
                barColor="#2E6F5E"
                slantLabels={true}
              />

              <SvgBarChart
                data={normalizeHourlyData(xReport?.transactionsByHour, 'transactions')}
                xKey="time_label"
                yKey="transactions"
                title="Transactions by Hour"
                yLabel="Count"
                barColor="#A7C957"
                slantLabels={true}
              />

              <SvgBarChart
                data={xReport?.transactionsByEmployee || []}
                xKey="employee_name"
                yKey="transactions"
                title="Transactions by Employee"
                yLabel="Orders"
                barColor="#2E6F5E"
                slantLabels={true}
              />
            </div>
          </div>
        )}

        {/* TAB 2: INVENTORY USAGE */}
        {activeTab === 'usage' && (
          <div className="manager-card">
            <div className="card-title-row">
              <h2>Inventory Consumption & Usage Chart</h2>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.92rem', marginTop: 0 }}>
              Displays total quantity of ingredients deducted from orders over the chosen date range.
            </p>

            <div className="controls-bar">
              <label>Start Date:</label>
              <input
                type="date"
                className="date-input"
                value={usageStart}
                onChange={(e) => setUsageStart(e.target.value)}
              />
              <label>End Date:</label>
              <input
                type="date"
                className="date-input"
                value={usageEnd}
                onChange={(e) => setUsageEnd(e.target.value)}
              />
              <button className="btn-primary" onClick={handleGenerateUsageReport}>
                Update Graph
              </button>
            </div>

            <SvgBarChart
              data={usageData}
              xKey="item_name"
              yKey="total_qty_used"
              title="Ingredient Units Consumed"
              yLabel="Units"
              barColor="#2E6F5E"
              slantLabels={true}
              height={260}
            />

            <div className="manager-table-wrapper" style={{ marginTop: '1.25rem' }}>
              <table className="manager-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ingredient / Supply Name</th>
                    <th>Quantity Used</th>
                  </tr>
                </thead>
                <tbody>
                  {usageData.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8' }}>
                        No inventory usage recorded for these dates.
                      </td>
                    </tr>
                  ) : (
                    usageData.map((row, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td><strong>{row.item_name}</strong></td>
                        <td><code>{row.total_qty_used}</code></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SALES REPORT */}
        {activeTab === 'sales' && (
          <div className="manager-card">
            <div className="card-title-row">
              <h2>Sales Report (Sales by Item)</h2>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.92rem', marginTop: 0 }}>
              Calculates revenue and units sold per menu item from order history.
            </p>

            <div className="controls-bar">
              <label>Start Date:</label>
              <input
                type="date"
                className="date-input"
                value={salesStart}
                onChange={(e) => setSalesStart(e.target.value)}
              />
              <label>End Date:</label>
              <input
                type="date"
                className="date-input"
                value={salesEnd}
                onChange={(e) => setSalesEnd(e.target.value)}
              />
              <button className="btn-primary" onClick={handleGenerateSalesReport}>
                Generate Report
              </button>
            </div>

            {/* Sales KPIs */}
            {(() => {
              const totalUnits = salesData.reduce((acc, row) => acc + (parseInt(row.units_sold) || 0), 0);
              const totalRev = salesData.reduce((acc, row) => acc + (parseFloat(row.total_sales) || 0), 0);
              const topItem = salesData.length > 0 ? salesData[0].product_name : 'N/A';
              return (
                <div className="kpi-grid">
                  <div className="kpi-card blue">
                    <div className="kpi-title">Total Units Sold</div>
                    <div className="kpi-value">{totalUnits}</div>
                  </div>
                  <div className="kpi-card purple">
                    <div className="kpi-title">Total Sales Revenue</div>
                    <div className="kpi-value">${totalRev.toFixed(2)}</div>
                  </div>
                  <div className="kpi-card green">
                    <div className="kpi-title">Top Selling Item</div>
                    <div className="kpi-value" style={{ fontSize: '1.4rem' }}>{topItem}</div>
                  </div>
                </div>
              );
            })()}

            <SvgBarChart
              data={salesData.slice(0, 15)}
              xKey="product_name"
              yKey="units_sold"
              title="Top Selling Menu Items (Units)"
              yLabel="Units"
              barColor="#2E6F5E"
              slantLabels={true}
              height={260}
            />

            <div className="manager-table-wrapper" style={{ marginTop: '1.25rem' }}>
              <table className="manager-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product Name</th>
                    <th>Units Sold</th>
                    <th>Total Sales ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8' }}>
                        No sales recorded for this date window.
                      </td>
                    </tr>
                  ) : (
                    salesData.map((row, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td><strong>{row.product_name}</strong></td>
                        <td><code>{row.units_sold}</code></td>
                        <td><strong>${parseFloat(row.total_sales).toFixed(2)}</strong></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: INVENTORY MANAGEMENT */}
        {activeTab === 'inventory' && (
          <div>
            {/* Low Inventory Alert Section */}
            <div className="manager-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <div className="card-title-row">
                <h2>Low Inventory Restock Warnings (&lt; 50 Units)</h2>
                <span className="badge-pill badge-low">{lowStock.length} Items Low</span>
              </div>
              {lowStock.length === 0 ? (
                <p style={{ color: '#166534', fontWeight: 600 }}>Nothing needs restocking right now!</p>
              ) : (
                <div className="manager-table-wrapper">
                  <table className="manager-table">
                    <thead>
                      <tr>
                        <th>Item Name</th>
                        <th>Units in Stock</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStock.map((item, idx) => (
                        <tr key={idx} onClick={() => setSelectedInvItem({ item_name: item.item_name, amount: item.amount })}>
                          <td><strong>{item.item_name}</strong></td>
                          <td><code style={{ color: '#991b1b', fontWeight: 'bold' }}>{item.amount}</code></td>
                          <td><span className="badge-pill badge-low">Restock Needed</span></td>
                          <td>
                            <button
                              className="btn-secondary"
                              style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                              onClick={() => setSelectedInvItem({ item_name: item.item_name, amount: item.amount })}
                            >
                              Select to Restock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Full Inventory Table */}
            <div className="manager-card">
              <div className="card-title-row">
                <h2>Inventory Management (All Items)</h2>
                <input
                  type="text"
                  placeholder="Filter inventory items..."
                  className="form-input"
                  value={invSearch}
                  onChange={(e) => setInvSearch(e.target.value)}
                  style={{ width: '250px' }}
                />
              </div>

              <div className="manager-table-wrapper" style={{ maxHeight: '360px' }}>
                <table className="manager-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item Name</th>
                      <th>Units In Stock</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory
                      .filter(i => !invSearch || i.item_name.toLowerCase().includes(invSearch.toLowerCase()))
                      .map((item, idx) => (
                        <tr
                          key={idx}
                          className={selectedInvItem.item_name === item.item_name ? 'selected-row' : ''}
                          onClick={() => setSelectedInvItem({ item_name: item.item_name, amount: item.amount })}
                        >
                          <td>{idx + 1}</td>
                          <td><strong>{item.item_name}</strong></td>
                          <td><code>{item.amount}</code></td>
                          <td>
                            {item.amount < 50 ? (
                              <span className="badge-pill badge-low">Low Stock</span>
                            ) : (
                              <span className="badge-pill badge-ok">In Stock</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Update Stock Form (matches Project 2 bottom bar) */}
              <form onSubmit={handleUpdateStock} className="panel-form" style={{ marginTop: '1.25rem' }}>
                <div style={{ fontWeight: 600, color: '#334155' }}>
                  Update Stock Quantity for Selected Item:
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="item_name"
                    value={selectedInvItem.item_name}
                    readOnly
                    style={{ background: '#f1f5f9', fontWeight: 600, width: '220px' }}
                  />
                  <input
                    type="number"
                    className="form-input"
                    placeholder="amount"
                    value={selectedInvItem.amount}
                    onChange={(e) => setSelectedInvItem({ ...selectedInvItem, amount: e.target.value })}
                    style={{ width: '130px' }}
                  />
                  <button type="submit" className="btn-primary">
                    Update Stock
                  </button>
                </div>
              </form>

              {/* Add New Inventory Item Section */}
              <form onSubmit={handleAddInventoryItem} className="panel-form" style={{ marginTop: '1rem', background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <div style={{ fontWeight: 700, color: '#166534' }}>
                  + Add New Inventory Supply / Ingredient
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="New Item Name (e.g. Vanilla Syrup)"
                    value={newInvForm.name}
                    onChange={(e) => setNewInvForm({ ...newInvForm, name: e.target.value })}
                    style={{ flex: 1, minWidth: '180px' }}
                  />
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Initial Stock"
                    value={newInvForm.stock}
                    onChange={(e) => setNewInvForm({ ...newInvForm, stock: e.target.value })}
                    style={{ width: '110px' }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="Unit Cost ($)"
                    value={newInvForm.cost}
                    onChange={(e) => setNewInvForm({ ...newInvForm, cost: e.target.value })}
                    style={{ width: '110px' }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={newInvForm.isAddable}
                      onChange={(e) => setNewInvForm({ ...newInvForm, isAddable: e.target.checked })}
                    />
                    Is Customer Add-in?
                  </label>
                  <button type="submit" className="btn-success">
                    Create Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 5: MENU / EMPLOYEES (Split View from Project 2) */}
        {activeTab === 'menu_emp' && (
          <div className="split-grid">
            {/* Left Column: Employees */}
            <div className="manager-card">
              <div className="card-title-row">
                <h2>Employees</h2>
                <span className="badge-pill badge-employee">{employees.length} Staff</span>
              </div>

              <div className="manager-table-wrapper" style={{ maxHeight: '280px' }}>
                <table className="manager-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr
                        key={emp.employee_id}
                        className={selectedEmp.id === emp.employee_id ? 'selected-row' : ''}
                        onClick={() => setSelectedEmp({
                          id: emp.employee_id,
                          name: emp.employee_name,
                          isManager: emp.is_manager,
                          password: ''
                        })}
                      >
                        <td>#{emp.employee_id}</td>
                        <td><strong>{emp.employee_name}</strong></td>
                        <td>
                          {emp.is_manager ? (
                            <span className="badge-pill badge-manager">Manager</span>
                          ) : (
                            <span className="badge-pill badge-employee">Employee</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Edit Selected Employee Form */}
              <form onSubmit={handleUpdateEmployee} className="panel-form">
                <div style={{ fontWeight: 600, color: '#334155' }}>
                  Edit Selected Employee: {selectedEmp.id ? `#${selectedEmp.id}` : '(Click row above)'}
                </div>
                <input
                  type="text"
                  placeholder="employee_name"
                  className="form-input"
                  value={selectedEmp.name}
                  onChange={(e) => setSelectedEmp({ ...selectedEmp, name: e.target.value })}
                  disabled={!selectedEmp.id}
                />
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedEmp.isManager}
                      onChange={(e) => setSelectedEmp({ ...selectedEmp, isManager: e.target.checked })}
                      disabled={!selectedEmp.id}
                    />
                    Manager Status
                  </label>
                  <input
                    type="password"
                    placeholder="New password (leave blank to keep)"
                    className="form-input"
                    value={selectedEmp.password}
                    onChange={(e) => setSelectedEmp({ ...selectedEmp, password: e.target.value })}
                    disabled={!selectedEmp.id}
                    style={{ flex: 1 }}
                  />
                </div>
                <div className="button-row">
                  <button type="submit" className="btn-primary" disabled={!selectedEmp.id}>
                    Update
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={!selectedEmp.id}
                    onClick={() => handleRemoveEmployee(selectedEmp.id)}
                  >
                    Remove
                  </button>
                </div>
              </form>

              {/* Add New Employee */}
              <form onSubmit={handleAddEmployee} className="panel-form" style={{ marginTop: '1rem', background: '#f8fafc' }}>
                <div style={{ fontWeight: 600, color: '#334155' }}>+ Add New Employee</div>
                <input
                  type="text"
                  placeholder="New employee name"
                  className="form-input"
                  value={newEmpForm.name}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, name: e.target.value })}
                />
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={newEmpForm.isManager}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, isManager: e.target.checked })}
                    />
                    Is Manager?
                  </label>
                  <input
                    type="password"
                    placeholder="Password"
                    className="form-input"
                    value={newEmpForm.password}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, password: e.target.value })}
                    style={{ flex: 1 }}
                  />
                </div>
                <button type="submit" className="btn-secondary" style={{ alignSelf: 'flex-start' }}>
                  Add Employee
                </button>
              </form>
            </div>

            {/* Right Column: Menu (Products) */}
            <div className="manager-card">
              <div className="card-title-row">
                <h2>Menu (Products)</h2>
                <span className="badge-pill badge-ok">{products.length} Drinks</span>
              </div>

              <div className="manager-table-wrapper" style={{ maxHeight: '280px' }}>
                <table className="manager-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Price ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod, idx) => (
                      <tr
                        key={idx}
                        className={selectedProd.name === prod.name ? 'selected-row' : ''}
                        onClick={() => setSelectedProd(prod)}
                      >
                        <td><strong>{prod.name}</strong></td>
                        <td>${Number(prod.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Edit Selected Product Form */}
              <form onSubmit={handleUpdateProductPrice} className="panel-form">
                <div style={{ fontWeight: 600, color: '#334155' }}>
                  Selected Product: {selectedProd.name || '(Click drink above)'}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={selectedProd.name}
                    readOnly
                    placeholder="product_name"
                    style={{ background: '#f1f5f9', fontWeight: 600, flex: 1 }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={selectedProd.price}
                    onChange={(e) => setSelectedProd({ ...selectedProd, price: e.target.value })}
                    placeholder="price"
                    style={{ width: '110px' }}
                    disabled={!selectedProd.name}
                  />
                </div>

                {/* Recipe Summary */}
                <div style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic', padding: '0.25rem 0' }}>
                  Recipe:{' '}
                  {selectedProd.constituentItems && selectedProd.constituentItems.length > 0 ? (
                    <span style={{ color: '#047857', fontWeight: 600 }}>
                      {selectedProd.constituentItems.join(', ')}
                    </span>
                  ) : (
                    <span style={{ color: '#dc2626' }}>
                      None linked yet - Click "Edit Associated Items" to link
                    </span>
                  )}
                </div>

                <div className="button-row">
                  <button type="submit" className="btn-primary" disabled={!selectedProd.name}>
                    Update Price
                  </button>
                  <button
                    type="button"
                    className="btn-accent"
                    disabled={!selectedProd.name}
                    onClick={() => openRecipeModal(selectedProd.name, selectedProd.constituentItems || [])}
                  >
                    Edit Associated Items
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={!selectedProd.name}
                    onClick={() => handleRemoveProduct(selectedProd.name)}
                  >
                    Remove
                  </button>
                </div>
              </form>

              {/* Add New Product & Add Seasonal Item Section */}
              <div className="panel-form" style={{ marginTop: '1rem', background: '#f8fafc' }}>
                <div style={{ fontWeight: 600, color: '#334155' }}>+ Add New Product</div>
                <form onSubmit={handleAddProduct} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Product Name"
                    className="form-input"
                    value={newProdForm.name}
                    onChange={(e) => setNewProdForm({ ...newProdForm, name: e.target.value })}
                    style={{ flex: 1, minWidth: '150px' }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price $"
                    className="form-input"
                    value={newProdForm.price}
                    onChange={(e) => setNewProdForm({ ...newProdForm, price: e.target.value })}
                    style={{ width: '90px' }}
                  />
                  <button type="submit" className="btn-secondary">
                    Add New
                  </button>
                </form>

                <div style={{ marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ background: '#ca8a04', color: 'white' }}
                    onClick={() => setIsSeasonalModalOpen(true)}
                  >
                    &#9733; Add Seasonal Menu Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: TRENDS (ORDER HISTORY) */}
        {activeTab === 'trends' && (
          <div className="manager-card">
            <div className="card-title-row">
              <h2>Recent Orders & Sales Trends</h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem' }}>Rows:</label>
                <select
                  className="select-input"
                  value={orderLimit}
                  onChange={(e) => setOrderLimit(e.target.value)}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <button className="btn-primary" onClick={handleLoadOrderHistory}>
                  Refresh Orders
                </button>
              </div>
            </div>

            <div className="manager-table-wrapper" style={{ maxHeight: '450px' }}>
              <table className="manager-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer Name</th>
                    <th>Timestamp</th>
                    <th>Total Price ($)</th>
                    <th>Cashier Employee #</th>
                  </tr>
                </thead>
                <tbody>
                  {orderHistory.map((order) => (
                    <tr key={order.order_id}>
                      <td><strong>#{order.order_id}</strong></td>
                      <td>{order.customer_name || 'Walk-in Customer'}</td>
                      <td>{new Date(order.date_time).toLocaleString()}</td>
                      <td><strong>${Number(order.total_price).toFixed(2)}</strong></td>
                      <td>Employee #{order.employee_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL 1: EDIT ASSOCIATED RECIPE ITEMS */}
        {isRecipeModalOpen && (
          <div className="modal-backdrop">
            <div className="modal-dialog">
              <div className="modal-header">
                <h3>Manage Associated Inventory Items: {editingRecipeProd}</h3>
                <button className="close-btn" onClick={() => setIsRecipeModalOpen(false)}>&times;</button>
              </div>
              <div className="modal-body">
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                  Select the constituent ingredients that make up this product's recipe. When an order for this drink is placed, these inventory items are automatically deducted.
                </p>

                <input
                  type="text"
                  placeholder="Search ingredients..."
                  className="form-input"
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                />

                <div className="chip-container">
                  {allItems
                    .filter(item => !recipeSearch || item.toLowerCase().includes(recipeSearch.toLowerCase()))
                    .map((item) => {
                      const isSelected = modalSelectedItems.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          className={`chip-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            if (isSelected) {
                              setModalSelectedItems(modalSelectedItems.filter(i => i !== item));
                            } else {
                              setModalSelectedItems([...modalSelectedItems, item]);
                            }
                          }}
                        >
                          {isSelected ? `✓ ${item}` : item}
                        </button>
                      );
                    })}
                </div>

                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  Selected Ingredients ({modalSelectedItems.length}):{' '}
                  <span style={{ color: modalSelectedItems.length > 0 ? '#059669' : '#dc2626' }}>
                    {modalSelectedItems.length > 0 ? modalSelectedItems.join(', ') : 'None selected'}
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setIsRecipeModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSaveRecipe}>
                  Save Recipe
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: ADD SEASONAL MENU ITEM */}
        {isSeasonalModalOpen && (
          <div className="modal-backdrop">
            <div className="modal-dialog">
              <div className="modal-header">
                <h3>Add New Seasonal Menu Item</h3>
                <button className="close-btn" onClick={() => setIsSeasonalModalOpen(false)}>&times;</button>
              </div>
              <div className="modal-body">
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                  Introduce a brand new seasonal drink to the POS with its price, initial inventory supply, and constituent recipe ingredients.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Drink Name (e.g. Pumpkin Spice Milk Tea)"
                    className="form-input"
                    value={seasonalForm.name}
                    onChange={(e) => setSeasonalForm({ ...seasonalForm, name: e.target.value })}
                    style={{ flex: 1, minWidth: '200px' }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price $"
                    className="form-input"
                    value={seasonalForm.price}
                    onChange={(e) => setSeasonalForm({ ...seasonalForm, price: e.target.value })}
                    style={{ width: '100px' }}
                  />
                  <input
                    type="number"
                    placeholder="Stock Units"
                    className="form-input"
                    value={seasonalForm.stock}
                    onChange={(e) => setSeasonalForm({ ...seasonalForm, stock: e.target.value })}
                    style={{ width: '110px' }}
                  />
                </div>

                <label style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Select Recipe Ingredients for this Seasonal Drink:
                </label>

                <div className="chip-container">
                  {allItems.map((item) => {
                    const isSelected = seasonalItems.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        className={`chip-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            setSeasonalItems(seasonalItems.filter(i => i !== item));
                          } else {
                            setSeasonalItems([...seasonalItems, item]);
                          }
                        }}
                      >
                        {isSelected ? `✓ ${item}` : item}
                      </button>
                    );
                  })}
                </div>

                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  Selected Ingredients ({seasonalItems.length}):{' '}
                  <span style={{ color: seasonalItems.length > 0 ? '#059669' : '#dc2626' }}>
                    {seasonalItems.length > 0 ? seasonalItems.join(', ') : 'None selected'}
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setIsSeasonalModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSaveSeasonalProduct}>
                  Create Seasonal Drink
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="manager-footer">
          CSCE 331 &bull; Fall 2026 &bull; Troupe 04 &bull; Hosted on Render
        </footer>
      </div>
    </main>
  );
}
