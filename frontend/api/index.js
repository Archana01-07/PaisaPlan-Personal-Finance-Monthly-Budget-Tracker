// Self-contained in-memory API — no MongoDB needed
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'paisaplan_super_secret_jwt_key_2026_academic_demo';
const DEMO_EMAIL = 'demo@paisaplan.com';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo@12345';

// ── In-memory stores ──────────────────────────────────────────────────────────
const users = new Map();   // id -> user
const sessions = new Map(); // token -> userId (not strictly needed, JWT is stateless)

let nextId = 1;
function newId() { return String(nextId++); }

// Seed demo user synchronously — no async hashing needed
let demoUserId = 'demo-user-1';
users.set(demoUserId, { id: demoUserId, name: 'Sriman Student', email: DEMO_EMAIL, passwordHash: null, plainPassword: DEMO_PASSWORD });
const seedPromise = Promise.resolve();

// Demo transactions (Oct 2026 = current month)
const demoTransactions = [
  { id:'t1',  type:'income',  amountPaise:2000000, category:'Allowance',       date:'2026-10-01', description:'Monthly Allowance from Parents',      paymentMethod:'Bank transfer', notes:'October allowance' },
  { id:'t2',  type:'income',  amountPaise:1400000, category:'Freelance',       date:'2026-10-14', description:'React Dashboard UI Project Payout',    paymentMethod:'UPI',          notes:'Freelance client payment' },
  { id:'t3',  type:'expense', amountPaise: 850000, category:'Rent / Hostel',   date:'2026-10-02', description:'Campus Hostel & Mess Advance',         paymentMethod:'Bank transfer', notes:'Room fee October' },
  { id:'t4',  type:'expense', amountPaise:  98000, category:'Food & dining',   date:'2026-10-04', description:'Supermarket Groceries & Fruits',       paymentMethod:'Debit card',   notes:'Monthly staples' },
  { id:'t5',  type:'expense', amountPaise:  34900, category:'Mobile recharge', date:'2026-10-06', description:'Prepaid Data Plan Recharge',           paymentMethod:'UPI',          notes:'28-day 5G data plan' },
  { id:'t6',  type:'expense', amountPaise:  20900, category:'Subscriptions',   date:'2026-10-07', description:'Spotify Student Premium',             paymentMethod:'Credit card',  notes:'Monthly music streaming' },
  { id:'t7',  type:'expense', amountPaise:  85000, category:'Transport',       date:'2026-10-09', description:'Metro SmartCard Top-up',              paymentMethod:'UPI',          notes:'Monthly transit pass' },
  { id:'t8',  type:'expense', amountPaise: 120000, category:'Food & dining',   date:'2026-10-12', description:'Study Group Dinner & Cafeteria',      paymentMethod:'UPI',          notes:'Team project dinner' },
  { id:'t9',  type:'expense', amountPaise: 115000, category:'Books & supplies',date:'2026-10-15', description:'Distributed Systems Textbook',        paymentMethod:'Debit card',   notes:'Semester reference book' },
  { id:'t10', type:'expense', amountPaise:  19900, category:'Subscriptions',   date:'2026-10-16', description:'Cloud Storage 100GB',                 paymentMethod:'UPI',          notes:'Project backup' },
  { id:'t11', type:'expense', amountPaise:  42000, category:'Transport',       date:'2026-10-18', description:'Cab Ride to Tech Seminar',            paymentMethod:'UPI',          notes:'Campus commute' },
  { id:'t12', type:'expense', amountPaise:  84000, category:'Food & dining',   date:'2026-10-21', description:'Campus Canteen & Weekend Snacks',     paymentMethod:'Cash',         notes:'Weekly snacks' },
  { id:'t13', type:'expense', amountPaise:  75000, category:'Entertainment',   date:'2026-10-23', description:'Movie Night & Popcorn',               paymentMethod:'UPI',          notes:'Weekend relax' },
  { id:'t14', type:'expense', amountPaise:  28000, category:'Other',           date:'2026-10-24', description:'Stationery & Project Printing',       paymentMethod:'UPI',          notes:'Sprint report' },
  // Sept 2026
  { id:'t15', type:'income',  amountPaise:2000000, category:'Allowance',       date:'2026-09-01', description:'Monthly Allowance from Parents',      paymentMethod:'Bank transfer', notes:'' },
  { id:'t16', type:'income',  amountPaise:1200000, category:'Freelance',       date:'2026-09-15', description:'Web Development Project Honorarium',  paymentMethod:'UPI',          notes:'' },
  { id:'t17', type:'expense', amountPaise: 850000, category:'Rent / Hostel',   date:'2026-09-02', description:'Campus Hostel & Mess Advance',        paymentMethod:'Bank transfer', notes:'' },
  { id:'t18', type:'expense', amountPaise:  65000, category:'Food & dining',   date:'2026-09-03', description:'Campus Cafeteria Weekly Meal Pack',   paymentMethod:'UPI',          notes:'' },
  { id:'t19', type:'expense', amountPaise: 124000, category:'Food & dining',   date:'2026-09-08', description:'Supermarket Grocery Store',           paymentMethod:'Debit card',   notes:'' },
  { id:'t20', type:'expense', amountPaise:  85000, category:'Transport',       date:'2026-09-04', description:'Monthly Metro SmartCard Recharge',    paymentMethod:'UPI',          notes:'' },
  { id:'t21', type:'expense', amountPaise:  79000, category:'Books & supplies',date:'2026-09-05', description:'Algorithms & Data Structures Textbook',paymentMethod:'UPI',         notes:'' },
  { id:'t22', type:'expense', amountPaise:  52000, category:'Entertainment',   date:'2026-09-10', description:'Weekend Movie Ticket at Cinema',      paymentMethod:'UPI',          notes:'' },
  { id:'t23', type:'expense', amountPaise:  20900, category:'Subscriptions',   date:'2026-09-07', description:'Spotify Student Subscription',        paymentMethod:'Credit card',  notes:'' },
  { id:'t24', type:'expense', amountPaise:  34900, category:'Mobile recharge', date:'2026-09-06', description:'Prepaid 28-Day Data Pack Recharge',   paymentMethod:'UPI',          notes:'' },
];

// Per-user transaction stores (demo user gets the demo data)
const userTransactions = new Map(); // userId -> transaction[]
const userBudgets = new Map();      // userId -> { year_month -> budget }

function getUserTransactions(userId) {
  if (!userTransactions.has(userId)) {
    userTransactions.set(userId, userId === demoUserId ? [...demoTransactions] : []);
  }
  return userTransactions.get(userId);
}

function getUserBudgets(userId) {
  if (!userBudgets.has(userId)) {
    userBudgets.set(userId, new Map());
    if (userId === demoUserId) {
      // Seed demo budgets
      userBudgets.get(userId).set('2026_10', {
        year: 2026, month: 10,
        totalLimitPaise: 2600000,
        categoryAllocations: [
          { category: 'Rent / Hostel',   limitPaise: 850000 },
          { category: 'Food & dining',   limitPaise: 450000 },
          { category: 'Transport',       limitPaise: 250000 },
          { category: 'Books & supplies',limitPaise: 200000 },
          { category: 'Entertainment',   limitPaise: 150000 },
          { category: 'Subscriptions',   limitPaise:  70000 },
          { category: 'Mobile recharge', limitPaise:  50000 },
          { category: 'Other',           limitPaise: 580000 },
        ],
      });
      userBudgets.get(userId).set('2026_9', {
        year: 2026, month: 9,
        totalLimitPaise: 2550000,
        categoryAllocations: [
          { category: 'Rent / Hostel',   limitPaise: 850000 },
          { category: 'Food & dining',   limitPaise: 400000 },
          { category: 'Transport',       limitPaise: 250000 },
          { category: 'Books & supplies',limitPaise: 200000 },
          { category: 'Entertainment',   limitPaise: 150000 },
          { category: 'Subscriptions',   limitPaise:  70000 },
          { category: 'Mobile recharge', limitPaise:  50000 },
          { category: 'Other',           limitPaise: 580000 },
        ],
      });
    }
  }
  return userBudgets.get(userId);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function paiseToRupees(p) { return p / 100; }
function rupeesToPaise(r) { return Math.round(Number(r) * 100); }
function formatINR(paise) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);
}

function formatTx(t) {
  return {
    id: t.id, userId: t.userId, type: t.type,
    amountPaise: t.amountPaise,
    amountRupees: paiseToRupees(t.amountPaise),
    formattedAmount: formatINR(t.amountPaise),
    category: t.category, date: t.date, description: t.description,
    paymentMethod: t.paymentMethod, notes: t.notes || '',
    createdAt: t.createdAt || t.date, updatedAt: t.updatedAt || t.date,
  };
}

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function sendCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function authMiddleware(req, res, next) {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.get(decoded.userId);
    if (!user) return res.status(401).json({ success: false, message: 'User not found.' });
    req.user = user;
    next();
  } catch {
    res.clearCookie('token');
    return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
  }
}

// ── Express app ───────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok', database: 'in-memory' }));

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  await seedPromise;
  const { name, email, password, confirmPassword } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success: false, message: 'All fields are required.' });
  if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
  if (password !== confirmPassword) return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  const existing = [...users.values()].find(u => u.email === email.toLowerCase().trim());
  if (existing) return res.status(409).json({ success: false, message: 'An account with this email address already exists.', errors:[{field:'email',message:'Email already registered'}] });
  const id = newId();
  const user = { id, name: name.trim(), email: email.toLowerCase().trim(), plainPassword: password };
  users.set(id, user);
  const token = signToken(id);
  sendCookie(res, token);
  return res.status(201).json({ success: true, message: 'Account created successfully', token, user: { id, name: user.name, email: user.email } });
});

app.post('/api/auth/login', async (req, res) => {
  await seedPromise;
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required.' });
  const user = [...users.values()].find(u => u.email === email.toLowerCase().trim());
  if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  const match = user.plainPassword
    ? password === user.plainPassword
    : await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  const token = signToken(user.id);
  sendCookie(res, token);
  return res.json({ success: true, message: 'Signed in successfully', token, user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'none', path: '/' });
  return res.json({ success: true, message: 'Signed out successfully' });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const u = req.user;
  return res.json({ success: true, user: { id: u.id, name: u.name, email: u.email } });
});

// ── Users ─────────────────────────────────────────────────────────────────────
app.patch('/api/users/me', authMiddleware, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Name is required.' });
  req.user.name = name.trim();
  users.set(req.user.id, req.user);
  return res.json({ success: true, message: 'Profile updated', user: { id: req.user.id, name: req.user.name, email: req.user.email } });
});

// ── Transactions ──────────────────────────────────────────────────────────────
app.get('/api/transactions', authMiddleware, (req, res) => {
  const { search, month, year, category, type, sort = 'date-desc', page = 1, limit = 10 } = req.query;
  let txs = getUserTransactions(req.user.id).filter(t => t.userId === req.user.id || req.user.id === demoUserId);

  // For demo user, only show their transactions
  if (req.user.id !== demoUserId) {
    txs = getUserTransactions(req.user.id);
  }

  if (month && year) {
    const y = parseInt(year), m = parseInt(month);
    const pad = n => String(n).padStart(2, '0');
    const prefix = `${y}-${pad(m)}`;
    txs = txs.filter(t => t.date.startsWith(prefix));
  }
  if (type === 'income' || type === 'expense') txs = txs.filter(t => t.type === type);
  if (category && category !== 'all') txs = txs.filter(t => t.category === category);
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    txs = txs.filter(t => t.description.toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q));
  }

  if (sort === 'date-asc') txs.sort((a, b) => a.date.localeCompare(b.date));
  else if (sort === 'amount-desc') txs.sort((a, b) => b.amountPaise - a.amountPaise);
  else if (sort === 'amount-asc') txs.sort((a, b) => a.amountPaise - b.amountPaise);
  else txs.sort((a, b) => b.date.localeCompare(a.date));

  // Summary
  const allMonthTxs = month && year ? txs : getUserTransactions(req.user.id);
  const incomePaise = allMonthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amountPaise, 0);
  const expensePaise = allMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amountPaise, 0);

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const total = txs.length;
  const paged = txs.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return res.json({
    success: true,
    transactions: paged.map(formatTx),
    totalCount: total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    limit: limitNum,
    summary: {
      incomePaise, incomeRupees: paiseToRupees(incomePaise),
      expensePaise, expenseRupees: paiseToRupees(expensePaise),
      netPaise: incomePaise - expensePaise, netRupees: paiseToRupees(incomePaise - expensePaise),
    },
  });
});

app.get('/api/transactions/:id', authMiddleware, (req, res) => {
  const txs = getUserTransactions(req.user.id);
  const tx = txs.find(t => t.id === req.params.id);
  if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
  return res.json({ success: true, transaction: formatTx(tx) });
});

app.post('/api/transactions', authMiddleware, (req, res) => {
  const { type, amount, category, date, description, paymentMethod, notes } = req.body;
  if (!type || !amount || !category || !date || !description || !paymentMethod) {
    return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
  }
  const tx = {
    id: 'tx-' + Date.now(),
    userId: req.user.id,
    type, amountPaise: rupeesToPaise(amount),
    category, date, description, paymentMethod, notes: notes || '',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  getUserTransactions(req.user.id).push(tx);
  return res.status(201).json({ success: true, message: 'Transaction recorded successfully', transaction: formatTx(tx) });
});

app.patch('/api/transactions/:id', authMiddleware, (req, res) => {
  const txs = getUserTransactions(req.user.id);
  const idx = txs.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Transaction not found' });
  const { type, amount, category, date, description, paymentMethod, notes } = req.body;
  txs[idx] = { ...txs[idx], type, amountPaise: rupeesToPaise(amount), category, date, description, paymentMethod, notes: notes || '', updatedAt: new Date().toISOString() };
  return res.json({ success: true, message: 'Transaction updated', transaction: formatTx(txs[idx]) });
});

app.delete('/api/transactions/:id', authMiddleware, (req, res) => {
  const txs = getUserTransactions(req.user.id);
  const idx = txs.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Transaction not found' });
  txs.splice(idx, 1);
  return res.json({ success: true, message: 'Transaction deleted successfully' });
});

// ── Budget ────────────────────────────────────────────────────────────────────
app.get('/api/budgets', authMiddleware, (req, res) => {
  const { month, year } = req.query;
  if (!month || !year) return res.status(400).json({ success: false, message: 'Month and year required.' });
  const y = parseInt(year), m = parseInt(month);
  const budgets = getUserBudgets(req.user.id);
  const budget = budgets.get(`${y}_${m}`) || { year: y, month: m, totalLimitPaise: 0, categoryAllocations: [] };
  const txs = getUserTransactions(req.user.id);
  const pad = n => String(n).padStart(2, '0');
  const prefix = `${y}-${pad(m)}`;
  const monthTxs = txs.filter(t => t.date.startsWith(prefix) && t.type === 'expense');
  const spentPaise = monthTxs.reduce((s, t) => s + t.amountPaise, 0);
  const categorySpend = {};
  monthTxs.forEach(t => { categorySpend[t.category] = (categorySpend[t.category] || 0) + t.amountPaise; });
  const categories = budget.categoryAllocations.map(a => ({
    category: a.category,
    limitPaise: a.limitPaise,
    limitRupees: paiseToRupees(a.limitPaise),
    spentPaise: categorySpend[a.category] || 0,
    spentRupees: paiseToRupees(categorySpend[a.category] || 0),
    remainingPaise: a.limitPaise - (categorySpend[a.category] || 0),
    percentUsed: a.limitPaise > 0 ? Math.round(((categorySpend[a.category] || 0) / a.limitPaise) * 100) : 0,
    isOverBudget: (categorySpend[a.category] || 0) > a.limitPaise,
  }));
  return res.json({
    success: true,
    data: {
      year: y, month: m,
      totalLimitPaise: budget.totalLimitPaise,
      totalLimitRupees: paiseToRupees(budget.totalLimitPaise),
      totalSpentPaise: spentPaise,
      totalSpentRupees: paiseToRupees(spentPaise),
      totalRemainingPaise: budget.totalLimitPaise - spentPaise,
      totalRemainingRupees: paiseToRupees(budget.totalLimitPaise - spentPaise),
      percentUsed: budget.totalLimitPaise > 0 ? Math.round((spentPaise / budget.totalLimitPaise) * 100) : 0,
      isOverBudget: spentPaise > budget.totalLimitPaise,
      categoryAllocations: categories,
      hasBudget: budget.totalLimitPaise > 0,
    },
  });
});

app.put('/api/budgets/:year/:month', authMiddleware, (req, res) => {
  const y = parseInt(req.params.year), m = parseInt(req.params.month);
  const { totalLimit, categoryAllocations = [] } = req.body;
  if (!totalLimit) return res.status(400).json({ success: false, message: 'totalLimit is required.' });
  const budgets = getUserBudgets(req.user.id);
  const budget = {
    year: y, month: m,
    totalLimitPaise: rupeesToPaise(totalLimit),
    categoryAllocations: categoryAllocations.map(a => ({ category: a.category, limitPaise: rupeesToPaise(a.limit) })),
  };
  budgets.set(`${y}_${m}`, budget);
  return res.json({ success: true, message: 'Budget saved successfully', data: budget });
});

// ── Dashboard ─────────────────────────────────────────────────────────────────
app.get('/api/dashboard', authMiddleware, (req, res) => {
  let { month, year } = req.query;
  if (!month || !year) { year = '2026'; month = '10'; }
  const y = parseInt(year), m = parseInt(month);
  const pad = n => String(n).padStart(2, '0');
  const prefix = `${y}-${pad(m)}`;
  const txs = getUserTransactions(req.user.id);
  const monthTxs = txs.filter(t => t.date.startsWith(prefix));
  const incomePaise = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amountPaise, 0);
  const expensePaise = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amountPaise, 0);
  const budgets = getUserBudgets(req.user.id);
  const budget = budgets.get(`${y}_${m}`);
  const budgetLimitPaise = budget?.totalLimitPaise || 0;

  // 6-month trend
  const sixMonthTrend = [];
  for (let i = 5; i >= 0; i--) {
    let tm = m - i; let ty = y;
    while (tm < 1) { tm += 12; ty--; }
    const tp = `${ty}-${pad(tm)}`;
    const mtxs = txs.filter(t => t.date.startsWith(tp));
    sixMonthTrend.push({
      year: ty, month: tm,
      incomePaise: mtxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amountPaise, 0),
      expensePaise: mtxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amountPaise, 0),
    });
  }

  // Category breakdown
  const catMap = {};
  monthTxs.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amountPaise;
  });
  const categoryBreakdown = Object.entries(catMap).map(([category, paise]) => ({
    category, amountPaise: paise, amountRupees: paiseToRupees(paise),
    percentage: expensePaise > 0 ? Math.round((paise / expensePaise) * 100) : 0,
  })).sort((a, b) => b.amountPaise - a.amountPaise);

  return res.json({
    success: true,
    data: {
      summary: {
        incomePaise, incomeRupees: paiseToRupees(incomePaise),
        expensePaise, expenseRupees: paiseToRupees(expensePaise),
        netPaise: incomePaise - expensePaise, netRupees: paiseToRupees(incomePaise - expensePaise),
        budgetLimitPaise, budgetLimitRupees: paiseToRupees(budgetLimitPaise),
        budgetRemainingPaise: budgetLimitPaise - expensePaise,
        budgetRemainingRupees: paiseToRupees(budgetLimitPaise - expensePaise),
        budgetPercentUsed: budgetLimitPaise > 0 ? Math.round((expensePaise / budgetLimitPaise) * 100) : 0,
        transactionCount: monthTxs.length,
      },
      sixMonthTrend,
      categoryBreakdown,
    },
  });
});

// ── Insights ──────────────────────────────────────────────────────────────────
app.get('/api/insights', authMiddleware, (req, res) => {
  let { month, year } = req.query;
  if (!month || !year) { year = '2026'; month = '10'; }
  const y = parseInt(year), m = parseInt(month);
  const pad = n => String(n).padStart(2, '0');
  const prefix = `${y}-${pad(m)}`;
  const txs = getUserTransactions(req.user.id);
  const monthTxs = txs.filter(t => t.date.startsWith(prefix));
  const expenseTxs = monthTxs.filter(t => t.type === 'expense');
  const totalExpense = expenseTxs.reduce((s, t) => s + t.amountPaise, 0);

  // Prev month
  let pm = m - 1, py = y;
  if (pm < 1) { pm = 12; py--; }
  const prevPrefix = `${py}-${pad(pm)}`;
  const prevExpense = txs.filter(t => t.date.startsWith(prevPrefix) && t.type === 'expense').reduce((s, t) => s + t.amountPaise, 0);

  const catMap = {};
  expenseTxs.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amountPaise; });
  const topCategories = Object.entries(catMap).map(([category, paise]) => ({
    category, amountPaise: paise, amountRupees: paiseToRupees(paise),
    percentage: totalExpense > 0 ? Math.round((paise / totalExpense) * 100) : 0,
  })).sort((a, b) => b.amountPaise - a.amountPaise);

  const budgets = getUserBudgets(req.user.id);
  const budget = budgets.get(`${y}_${m}`);
  const overBudgetCategories = budget ? budget.categoryAllocations
    .filter(a => (catMap[a.category] || 0) > a.limitPaise)
    .map(a => ({
      category: a.category,
      limitPaise: a.limitPaise, spentPaise: catMap[a.category] || 0,
      overByPaise: (catMap[a.category] || 0) - a.limitPaise,
    })) : [];

  return res.json({
    success: true,
    data: {
      totalExpensePaise: totalExpense,
      totalExpenseRupees: paiseToRupees(totalExpense),
      prevMonthExpensePaise: prevExpense,
      prevMonthExpenseRupees: paiseToRupees(prevExpense),
      monthOverMonthChange: prevExpense > 0 ? Math.round(((totalExpense - prevExpense) / prevExpense) * 100) : 0,
      topCategories,
      overBudgetCategories,
      transactionCount: expenseTxs.length,
    },
  });
});

// ── Serverless export ─────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  await seedPromise;
  return app(req, res);
};
