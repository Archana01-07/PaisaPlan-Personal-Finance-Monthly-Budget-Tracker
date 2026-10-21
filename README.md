# PaisaPlan — Personal Finance & Monthly Budget Tracker

**PaisaPlan** is a full-stack MERN (MongoDB, Express.js, React, Node.js) web application designed specifically for students and individuals to manually record income and expenses, plan monthly category budgets, monitor live budget usage, and gain factual spending insights.

---

## Key Features

1. **Manual Financial Tracking**: Designed for manual record-keeping without third-party bank linking, payment gateways, or UPI auto-scraping.
2. **Authoritative Financial Calculations**: All balances, totals, category allocations, and percentages are computed in 64-bit integer paise (1 INR = 100 paise) on the backend to avoid floating-point rounding errors.
3. **Strict User Scoping & Ownership**: Every read, write, edit, and delete operation derives user identity from verified JWT tokens stored in HttpOnly cookies. Users cannot access or tamper with other users' records.
4. **Interactive Dashboard**:
   - Monthly summary cards (Income, Expenses, Monthly Balance, Budget Remaining).
   - Monthly balance represents selected-month income minus expenses.
   - 6-month historical income vs. expense bar chart.
   - Monthly category spending donut/pie chart.
   - 5 recent transactions with direct detail links.
5. **Transactions Management**:
   - Full filtering by search keyword, income/expense type, category, and month.
   - Sorting by date (newest/oldest) and amount (highest/lowest).
   - Clean pagination with real-time count metrics.
   - Add/Edit transactions with a **Live Budget Impact Preview** showing category remaining/over-budget amounts before saving.
   - Confirmation modal before transaction deletion.
6. **Monthly Budget Planning**:
   - Monthly allocation across 8 expense categories: Rent / Hostel, Food & dining, Transport, Books & supplies, Entertainment, Subscriptions, Mobile recharge, Other.
   - Automatic calculation of unallocated monthly funds.
   - Real-time progress bars capped at 100% visually, with exact percentage indicators (e.g., 107%).
   - Dynamic status badges: *Within budget* (teal), *Approaching limit* (80%–100%, amber), and *Over budget* (red).
7. **Factual Spending Insights**:
   - Daily average spending based on elapsed days for active months or total days for completed months.
   - Largest single individual transaction identification.
   - Monthly surplus rate with explicit mathematical definition tooltip: `(Income - Expenses) / Income × 100`.
   - 5-week date-bucket spending bar chart.
   - Month-over-month spending comparison.
   - Data-backed observations directly generated from stored transactions (no AI hallucinations).
8. **Account Settings**:
   - View registered email.
   - Update display name.
   - Secure session logout clearing authentication cookies.

---

## Technology Stack

- **Frontend**:
  - React 19 with Vite 8
  - Tailwind CSS v4
  - React Router v7 (`react-router-dom`)
  - Axios with credentials and interceptors
  - Recharts for responsive SVG data visualizations
  - Lucide React for consistent outline iconography
- **Backend**:
  - Node.js (v20+ or v25)
  - Express.js
  - MongoDB & Mongoose
  - JSON Web Tokens (`jsonwebtoken`) via HttpOnly cookies
  - Password hashing via `bcryptjs`
  - Input validation using Zod
  - Security via CORS whitelist and `express-rate-limit`
  - Zero-config auto-fallback to embedded in-memory MongoDB server (`mongodb-memory-server`) if local MongoDB daemon is not running
- **Testing**:
  - Vitest test runner with automated calculation, precision, and security ownership test suites.
  - Supertest for integration route assertions.

---

## Project Structure

```
PFBT/
├── package.json              # Root scripts (dev, start, test, build, seed)
├── .env.example              # Environment variables template
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── scripts/
│   │   └── seed.js           # Idempotent demo dataset seed script (September 2026)
│   ├── src/
│   │   ├── app.js            # Express app configuration & middleware
│   │   ├── server.js         # HTTP server startup & graceful shutdown
│   │   ├── config/
│   │   │   ├── db.js         # MongoDB connection with memory-server fallback
│   │   │   └── constants.js  # Expense/income categories, payment methods, months
│   │   ├── models/
│   │   │   ├── User.js       # User schema with bcrypt hashing & unique normalized email
│   │   │   ├── Transaction.js# Transaction schema in integer paise with compound index
│   │   │   └── Budget.js     # Monthly budget schema with category allocations
│   │   ├── middleware/
│   │   │   ├── auth.js       # JWT cookie & Bearer token verification
│   │   │   ├── validate.js   # Zod request validation
│   │   │   ├── rateLimiter.js# Auth rate limiter
│   │   │   └── errorHandler.js# Centralized error responses
│   │   ├── services/
│   │   │   └── calculationService.js # Authoritative server-side financial metrics
│   │   ├── controllers/      # Route controllers (auth, user, transaction, budget, etc.)
│   │   └── routes/           # REST endpoints
│   └── tests/
│       ├── calculations.test.js    # Financial rounding, paise, & calendar dates
│       └── authAndOwnership.test.js# User isolation, registration, & security
└── frontend/
    ├── package.json
    ├── vite.config.js        # Vite config with Tailwind & /api proxy
    ├── index.html
    └── src/
        ├── App.jsx           # Route tree & navigation guards
        ├── api/              # Axios client and API services
        ├── context/          # AuthContext and DateContext
        ├── utils/            # Currency formatting (INR), dates, constants
        ├── components/
        │   ├── layout/       # Sidebar, MobileNavigation, PageHeader, MonthSelector
        │   ├── ui/           # SummaryCard, ChartContainer, EmptyState, Modal, Toast
        │   ├── transactions/ # TransactionList, TransactionFilters, TransactionForm
        │   └── budget/       # BudgetCategoryRow, BudgetFormModal
        └── pages/            # SignUp, SignIn, Dashboard, Transactions, Budget, etc.
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (Node v20.x or v25.x recommended).
- **npm**: v9.0.0 or higher.
- *(Optional)* **MongoDB**: Local MongoDB instance running on `localhost:27017` or a MongoDB Atlas URI. If no local MongoDB is installed, PaisaPlan will automatically initialize an embedded MongoDB server on launch.

---

### 2. Dependency Installation

To install all dependencies for root, backend, and frontend with a single command:

```bash
npm run install:all
```

Or install individually:

```bash
# Root dependencies
npm install

# Backend dependencies
cd backend && npm install

# Frontend dependencies
cd ../frontend && npm install
```

---

### 3. Environment Setup

Create `.env` in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

Default contents:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/paisaplan
JWT_SECRET=paisaplan_super_secret_jwt_key_2026_academic_demo
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
DEMO_PASSWORD=Demo@12345
COOKIE_SECURE=false
```

> **Note on MongoDB Configuration**:
> - If you have MongoDB installed locally, ensure the service is running.
> - If using MongoDB Atlas, replace `MONGODB_URI` with your connection string (`mongodb+srv://<user>:<password>@cluster.mongodb.net/paisaplan`).
> - If no external or local MongoDB daemon is running, PaisaPlan automatically falls back to an embedded in-memory MongoDB database.

---

### 4. Running the Application

To run the backend API server and frontend client concurrently from the root directory:

```bash
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

---

### 5. Seeding Demo Data

PaisaPlan includes a safe, idempotent seed command for academic evaluations. It seeds a demo user (`demo@paisaplan.com` / `Demo@12345`) with realistic transactions and budget for **September 2026** as well as historical months for trends.

To seed the dataset:

```bash
npm run seed
```

**Seeded September 2026 Target Metrics**:
- **Total Income**: ₹32,000
- **Total Expenses**: ₹18,540
  - Rent / Hostel: ₹8,500
  - Food & dining: ₹4,280 (₹4,000 allocation, 107% used, ₹280 over budget)
  - Transport: ₹2,140 (₹2,500 allocation, ₹360 remaining, 85.6% used)
  - Books & supplies: ₹1,240
  - Entertainment: ₹1,320
  - Subscriptions: ₹408
  - Mobile recharge: ₹349
  - Other: ₹303
- **Monthly Balance**: ₹13,460
- **Total Monthly Budget**: ₹25,500 (Remaining: ₹6,960)
- **August 2026 Expenses**: ₹18,040 (September spent ₹500 more than August)

---

### 6. Running Automated Tests

Run focused unit and integration tests verifying financial calculations, paise rounding, calendar date bounds, and protected data ownership:

```bash
npm test
```

---

### 7. Building for Production

To create an optimized production bundle of the React frontend:

```bash
npm run build
```

