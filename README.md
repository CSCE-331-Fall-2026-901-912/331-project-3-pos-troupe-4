# CSCE 331 - Web Application & PostgreSQL Database Connection

A full-stack Node.js and Express.js web application connecting to a remote PostgreSQL database, built for CSCE 331 (Fall 2026, Troupe 04).

---

## Lab Requirements & Demonstrated Evidence

### 1. Connected to PostgreSQL Database using Node.js and Express.js
- **Connection Pool**: Uses `pg.Pool` with SSL support (`ssl: { rejectUnauthorized: false }`) to manage connections efficiently without reconnect overhead.
- **Environment Configuration**: Database connection variables (`PSQL_HOST`, `PSQL_USER`, `PSQL_DATABASE`, `PSQL_PASSWORD`, `PSQL_PORT`) are loaded safely using `dotenv`.
- **Graceful Shutdown**: Listens for `SIGINT` (Ctrl+C) to gracefully terminate database connections via `pool.end()`.
- **EJS Templating Engine**: Dynamic server-side rendering for `/user` (querying the `teammembers` table) and `/products` (querying the live POS `products` table).

### 2. Demonstrated Best Practice Usage of `.gitignore`
- **Protected Secrets**: Sensitive database credentials in `.env` are strictly excluded from git tracking via `.gitignore`.
- **Excluded Dependencies**: Bulky installed packages in `node_modules/` are strictly ignored.
- **Tracked Template**: A sanitized `.env.example` file is tracked in git to document required environment variables without leaking credentials.
- **Verification Commands**:
  ```bash
  git status                # Confirms .env and node_modules are not listed
  git check-ignore -v .env  # Confirms .gitignore rule matching .env
  ```

### 3. Hosted Code Documentation
- Complete Javadoc documentation generated from our Java POS codebase is served directly by the Express application at `http://localhost:3000/docs`.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy the template and configure your database credentials:
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 3. Start the Server
```bash
node index.js
```
Open your browser to:
- **Home**: `http://localhost:3000/`
- **Team Members (/user)**: `http://localhost:3000/user`
- **POS Products (/products)**: `http://localhost:3000/products`
- **Hosted Code Documentation (/docs)**: `http://localhost:3000/docs`
