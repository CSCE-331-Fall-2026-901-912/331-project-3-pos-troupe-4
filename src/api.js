const API_URL = import.meta.env.VITE_API_URL;

// Reusable fetch helper
async function apiFetch(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, options);

    const data = response.status === 204
        ? null
        : await response.json();

    if (!response.ok) {
        throw new Error(data?.error || 'API request failed');
    }

    return data;
}

// GET requests

export async function getMenuItems() {
    return apiFetch('/menu');
}

export async function getManagerData() {
    return apiFetch('/manager');
}

export async function getAddableItems() {
    return apiFetch('/addable-items');
}

export async function getLowStockItems() {
    return apiFetch('/inventory/low-stock');
}

export async function getSalesReport(startDate, endDate) {
    const params = new URLSearchParams({ startDate, endDate });
    return apiFetch(`/salesReport?${params}`);
}

// INVENTORY

export async function addInventoryItem(itemName, initialStock, supplierCost, isAddable) {
    return apiFetch('/inventory', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            itemName,
            initialStock,
            supplierCost,
            isAddable
        })
    });
}

// EMPLOYEES

export async function addEmployee(employeeName, manager, password) {
    return apiFetch('/employees', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            employeeName,
            manager,
            password
        })
    });
}

export async function removeEmployee(employeeId) {
    return apiFetch(`/employees/${employeeId}`, {
        method: 'DELETE'
    });
}

// PRODUCTS

export async function addProduct(productName, price) {
    return apiFetch('/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            productName,
            price
        })
    });
}

export async function removeProduct(productName) {
    return apiFetch(`/products/${encodeURIComponent(productName)}`, {
        method: 'DELETE'
    });
}

export async function addProductWithItems(productName, price, constituentItems, newItemsStock) {
    return apiFetch('/products/complete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            productName,
            price,
            constituentItems,
            newItemsStock
        })
    });
}

export async function setProductConstituentItems(name, constituentItems) {
    return apiFetch(`/products/${encodeURIComponent(name)}/constituents`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            constituentItems
        })
    });
}

export async function getConstituentItems(name) {
    return apiFetch(`/products/${encodeURIComponent(name)}/constituents`);
}

// ITEMS

export async function addItem(itemName, supplierPricePerUnit, isAddable) {
    return apiFetch('/items', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            itemName,
            supplierPricePerUnit,
            isAddable
        })
    });
}

export async function removeItem(itemName) {
    return apiFetch(`/items/${encodeURIComponent(itemName)}`, {
        method: 'DELETE'
    });
}

// ORDERS

export async function placeOrder(order) {
    return apiFetch('/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
    });
}