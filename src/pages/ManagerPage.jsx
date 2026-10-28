import { useEffect, useState } from 'react';
import './ManagerPage.css';

export default function ManagerPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/manager')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Could not load manager data.');
        }
        return response.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <main className="manager-container">
        <section className="manager-card">
          <h1>CSCE 331 · Troupe 04 POS Web App</h1>
          <p className="manager-error">
            {error} Please check the server and try refreshing.
          </p>
        </section>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="manager-container">
        <section className="manager-card">
          <h1>CSCE 331 · Troupe 04 POS Web App</h1>
          <p>Loading manager data...</p>
        </section>
      </main>
    );
  }

  const { inventory, products, dbName, dbHost } = data;

  return (
    <main className="manager-container">
      <section className="manager-card">
        <h1>CSCE 331 · Troupe 04 POS Web App</h1>

        <div className="manager-status-badge">
          <span aria-hidden="true">●</span> Database Connected: {dbName} ({dbHost})
        </div>

        <p className="manager-description">
          Deployed Node.js + Express web application connected live to remote
          PostgreSQL database.
        </p>
      </section>

      <section className="manager-card">
        <h2>
          Current Inventory Stock (Queried from <code>inventory</code>)
        </h2>

        <div className="manager-table-wrapper">
          <table className="manager-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item / Ingredient</th>
                <th>Units in Stock</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, index) => (
                <tr key={`${item.item_name}-${index}`}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{item.item_name}</strong>
                  </td>
                  <td>
                    <code>{item.amount}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="manager-card">
        <h2>
          POS Menu Products (Queried from <code>products</code>)
        </h2>

        <div className="manager-table-wrapper">
          <table className="manager-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={`${product.product_name}-${index}`}>
                  <td>{index + 1}</td>
                  <td>{product.product_name}</td>
                  <td>
                    <strong>
                      ${Number(product.price).toFixed(2)}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="manager-footer">
        CSCE 331 · Fall 2026 · Troupe 04 · Hosted on Render
      </footer>
    </main>
  );
}