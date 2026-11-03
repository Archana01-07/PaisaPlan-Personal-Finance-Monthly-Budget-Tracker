// Zero-dependency in-memory API using raw Node.js
const JWT_SECRET = process.env.JWT_SECRET || 'paisaplan_demo_secret_2026';
const DEMO_EMAIL = 'demo@paisaplan.com';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo@12345';

// ── Tiny JWT (HS256) without jsonwebtoken package ─────────────────────────────
const crypto = require('crypto');

function base64url(str) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function signJWT(payload) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 }));
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${header}.${body}.${sig}`;
}
function verifyJWT(token) {
  try {
    const [header, body, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

// ── In-memory stores ──────────────────────────────────────────────────────────
const users = new Map();
const userTransactions = new Map();
const userBudgets = new Map();
let nextId = 1;
const newId = () => 'id-' + (nextId++);

// Demo user (plain password comparison — no bcrypt)
const DEMO_ID = 'demo-1';
users.set(DEMO_ID, { id: DEMO_ID, name: 'Sriman Student', email: DEMO_EMAIL, password: DEMO_PASSWORD });

// Demo data
const DEMO_TXS = [
  { id:'t1',  userId:DEMO_ID, type:'income',  amountPaise:2000000, category:'Allowance',        date:'2026-10-01', description:'Monthly Allowance from Parents',     paymentMethod:'Bank transfer', notes:'' },
  { id:'t2',  userId:DEMO_ID, type:'income',  amountPaise:1400000, category:'Freelance',        date:'2026-10-14', description:'React Dashboard UI Project Payout',   paymentMethod:'UPI',          notes:'' },
  { id:'t3',  userId:DEMO_ID, type:'expense', amountPaise: 850000, category:'Rent / Hostel',    date:'2026-10-02', description:'Campus Hostel & Mess Advance',        paymentMethod:'Bank transfer', notes:'' },
  { id:'t4',  userId:DEMO_ID, type:'expense', amountPaise:  98000, category:'Food & dining',    date:'2026-10-04', description:'Supermarket Groceries & Fruits',      paymentMethod:'Debit card',   notes:'' },
  { id:'t5',  userId:DEMO_ID, type:'expense', amountPaise:  34900, category:'Mobile recharge',  date:'2026-10-06', description:'Prepaid Data Plan Recharge',          paymentMethod:'UPI',          notes:'' },
  { id:'t6',  userId:DEMO_ID, type:'expense', amountPaise:  20900, category:'Subscriptions',    date:'2026-10-07', description:'Spotify Student Premium',             paymentMethod:'Credit card',  notes:'' },
  { id:'t7',  userId:DEMO_ID, type:'expense', amountPaise:  85000, category:'Transport',        date:'2026-10-09', description:'Metro SmartCard Top-up',              paymentMethod:'UPI',          notes:'' },
  { id:'t8',  userId:DEMO_ID, type:'expense', amountPaise: 120000, category:'Food & dining',    date:'2026-10-12', description:'Study Group Dinner & Cafeteria',      paymentMethod:'UPI',          notes:'' },
  { id:'t9',  userId:DEMO_ID, type:'expense', amountPaise: 115000, category:'Books & supplies', date:'2026-10-15', description:'Distributed Systems Textbook',        paymentMethod:'Debit card',   notes:'' },
  { id:'t10', userId:DEMO_ID, type:'expense', amountPaise:  19900, category:'Subscriptions',    date:'2026-10-16', description:'Cloud Storage 100GB',                 paymentMethod:'UPI',          notes:'' },
  { id:'t11', userId:DEMO_ID, type:'expense', amountPaise:  42000, category:'Transport',        date:'2026-10-18', description:'Cab Ride to Tech Seminar',            paymentMethod:'UPI',          notes:'' },
  { id:'t12', userId:DEMO_ID, type:'expense', amountPaise:  84000, category:'Food & dining',    date:'2026-10-21', description:'Campus Canteen & Weekend Snacks',     paymentMethod:'Cash',         notes:'' },
  { id:'t13', userId:DEMO_ID, type:'expense', amountPaise:  75000, category:'Entertainment',    date:'2026-10-23', description:'Movie Night & Popcorn',               paymentMethod:'UPI',          notes:'' },
  { id:'t14', userId:DEMO_ID, type:'expense', amountPaise:  28000, category:'Other',            date:'2026-10-24', description:'Stationery & Project Printing',       paymentMethod:'UPI',          notes:'' },
  { id:'t15', userId:DEMO_ID, type:'income',  amountPaise:2000000, category:'Allowance',        date:'2026-09-01', description:'Monthly Allowance from Parents',     paymentMethod:'Bank transfer', notes:'' },
  { id:'t16', userId:DEMO_ID, type:'income',  amountPaise:1200000, category:'Freelance',        date:'2026-09-15', description:'Web Development Project Honorarium',  paymentMethod:'UPI',          notes:'' },
  { id:'t17', userId:DEMO_ID, type:'expense', amountPaise: 850000, category:'Rent / Hostel',    date:'2026-09-02', description:'Campus Hostel & Mess Advance',        paymentMethod:'Bank transfer', notes:'' },
  { id:'t18', userId:DEMO_ID, type:'expense', amountPaise:  65000, category:'Food & dining',    date:'2026-09-03', description:'Campus Cafeteria Meal Pack',          paymentMethod:'UPI',          notes:'' },
  { id:'t19', userId:DEMO_ID, type:'expense', amountPaise: 124000, category:'Food & dining',    date:'2026-09-08', description:'Supermarket Grocery Store',           paymentMethod:'Debit card',   notes:'' },
  { id:'t20', userId:DEMO_ID, type:'expense', amountPaise:  85000, category:'Transport',        date:'2026-09-04', description:'Monthly Metro SmartCard Recharge',    paymentMethod:'UPI',          notes:'' },
  { id:'t21', userId:DEMO_ID, type:'expense', amountPaise:  79000, category:'Books & supplies', date:'2026-09-05', description:'Algorithms & Data Structures Textbook',paymentMethod:'UPI',         notes:'' },
  { id:'t22', userId:DEMO_ID, type:'expense', amountPaise:  52000, category:'Entertainment',    date:'2026-09-10', description:'Weekend Movie Ticket at Cinema',      paymentMethod:'UPI',          notes:'' },
  { id:'t23', userId:DEMO_ID, type:'expense', amountPaise:  20900, category:'Subscriptions',    date:'2026-09-07', description:'Spotify Student Subscription',        paymentMethod:'Credit card',  notes:'' },
  { id:'t24', userId:DEMO_ID, type:'expense', amountPaise:  34900, category:'Mobile recharge',  date:'2026-09-06', description:'Prepaid 28-Day Data Pack Recharge',   paymentMethod:'UPI',          notes:'' },
];
userTransactions.set(DEMO_ID, [...DEMO_TXS]);
userBudgets.set(DEMO_ID, new Map([
  ['2026_10', { year:2026, month:10, totalLimitPaise:2600000, categoryAllocations:[
    {category:'Rent / Hostel',limitPaise:850000},{category:'Food & dining',limitPaise:450000},
    {category:'Transport',limitPaise:250000},{category:'Books & supplies',limitPaise:200000},
    {category:'Entertainment',limitPaise:150000},{category:'Subscriptions',limitPaise:70000},
    {category:'Mobile recharge',limitPaise:50000},{category:'Other',limitPaise:580000},
  ]}],
  ['2026_9', { year:2026, month:9, totalLimitPaise:2550000, categoryAllocations:[
    {category:'Rent / Hostel',limitPaise:850000},{category:'Food & dining',limitPaise:400000},
    {category:'Transport',limitPaise:250000},{category:'Books & supplies',limitPaise:200000},
    {category:'Entertainment',limitPaise:150000},{category:'Subscriptions',limitPaise:70000},
    {category:'Mobile recharge',limitPaise:50000},{category:'Other',limitPaise:580000},
  ]}],
]));

// ── Helpers ───────────────────────────────────────────────────────────────────
const p2r = p => p / 100;
const r2p = r => Math.round(Number(r) * 100);
const fmtINR = p => '₹' + (p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pad = n => String(n).padStart(2, '0');

function getTxs(uid) { return userTransactions.get(uid) || []; }
function getBudgets(uid) { return userBudgets.get(uid) || new Map(); }

function fmtTx(t) {
  return { id:t.id, userId:t.userId, type:t.type, amountPaise:t.amountPaise, amountRupees:p2r(t.amountPaise),
    formattedAmount:fmtINR(t.amountPaise), category:t.category, date:t.date, description:t.description,
    paymentMethod:t.paymentMethod, notes:t.notes||'', createdAt:t.date, updatedAt:t.date };
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(c => {
    const [k, ...v] = c.trim().split('=');
    cookies[k.trim()] = decodeURIComponent(v.join('='));
  });
  return cookies;
}

function setCookieHeader(token) {
  return `token=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${7*24*3600}`;
}

function getAuth(req) {
  const cookies = parseCookies(req.headers['cookie']);
  let token = cookies['token'];
  if (!token && req.headers['authorization']?.startsWith('Bearer ')) {
    token = req.headers['authorization'].split(' ')[1];
  }
  if (!token) return null;
  const payload = verifyJWT(token);
  if (!payload) return null;
  return users.get(payload.userId) || null;
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', c => { data += c; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
    });
  });
}

function send(res, status, body, extraHeaders = {}) {
  const json = JSON.stringify(body);
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials': 'true', ...extraHeaders };
  res.writeHead(status, headers);
  res.end(json);
}

// ── Router ────────────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,Cookie',
      'Access-Control-Allow-Credentials': 'true',
    });
    return res.end();
  }

  // Health
  if (path === '/api/health') return send(res, 200, { status: 'ok', database: 'in-memory' });

  // ── Auth ────────────────────────────────────────────────────────────────────
  if (path === '/api/auth/register' && method === 'POST') {
    const { name, email, password, confirmPassword } = await readBody(req);
    if (!name?.trim() || !email?.trim() || !password) return send(res, 400, { success:false, message:'All fields are required.' });
    if (password.length < 8) return send(res, 400, { success:false, message:'Password must be at least 8 characters long.' });
    if (password !== confirmPassword) return send(res, 400, { success:false, message:'Passwords do not match.' });
    const norm = email.toLowerCase().trim();
    if ([...users.values()].find(u => u.email === norm)) return send(res, 409, { success:false, message:'An account with this email already exists.', errors:[{field:'email',message:'Email already registered'}] });
    const id = newId();
    users.set(id, { id, name:name.trim(), email:norm, password });
    if (!userTransactions.has(id)) userTransactions.set(id, []);
    if (!userBudgets.has(id)) userBudgets.set(id, new Map());
    const token = signJWT({ userId: id });
    return send(res, 201, { success:true, token, user:{ id, name:name.trim(), email:norm } }, { 'Set-Cookie': setCookieHeader(token) });
  }

  if (path === '/api/auth/login' && method === 'POST') {
    const { email, password } = await readBody(req);
    if (!email || !password) return send(res, 400, { success:false, message:'Email and password are required.' });
    const norm = email.toLowerCase().trim();
    const user = [...users.values()].find(u => u.email === norm);
    if (!user || user.password !== password) return send(res, 401, { success:false, message:'Invalid email or password.' });
    const token = signJWT({ userId: user.id });
    return send(res, 200, { success:true, token, user:{ id:user.id, name:user.name, email:user.email } }, { 'Set-Cookie': setCookieHeader(token) });
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    return send(res, 200, { success:true, message:'Signed out' }, { 'Set-Cookie': 'token=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0' });
  }

  if (path === '/api/auth/me' && method === 'GET') {
    const user = getAuth(req);
    if (!user) return send(res, 401, { success:false, message:'Authentication required.' });
    return send(res, 200, { success:true, user:{ id:user.id, name:user.name, email:user.email } });
  }

  // ── Users ───────────────────────────────────────────────────────────────────
  if (path === '/api/users/me' && method === 'PATCH') {
    const user = getAuth(req);
    if (!user) return send(res, 401, { success:false, message:'Authentication required.' });
    const { name } = await readBody(req);
    if (!name?.trim()) return send(res, 400, { success:false, message:'Name is required.' });
    user.name = name.trim();
    users.set(user.id, user);
    return send(res, 200, { success:true, user:{ id:user.id, name:user.name, email:user.email } });
  }

  // ── Transactions ────────────────────────────────────────────────────────────
  if (path === '/api/transactions' && method === 'GET') {
    const user = getAuth(req);
    if (!user) return send(res, 401, { success:false, message:'Authentication required.' });
    const { search, month, year, category, type, sort='date-desc', page='1', limit='10' } = Object.fromEntries(url.searchParams);
    let txs = getTxs(user.id);
    if (month && year) { const pfx = `${year}-${pad(month)}`; txs = txs.filter(t => t.date.startsWith(pfx)); }
    if (type === 'income' || type === 'expense') txs = txs.filter(t => t.type === type);
    if (category && category !== 'all') txs = txs.filter(t => t.category === category);
    if (search?.trim()) { const q = search.trim().toLowerCase(); txs = txs.filter(t => t.description.toLowerCase().includes(q)); }
    if (sort === 'date-asc') txs.sort((a,b) => a.date.localeCompare(b.date));
    else if (sort === 'amount-desc') txs.sort((a,b) => b.amountPaise - a.amountPaise);
    else if (sort === 'amount-asc') txs.sort((a,b) => a.amountPaise - b.amountPaise);
    else txs.sort((a,b) => b.date.localeCompare(a.date));
    const allTxs = getTxs(user.id);
    const inc = allTxs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amountPaise,0);
    const exp = allTxs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amountPaise,0);
    const pg = Math.max(1,parseInt(page)), lm = Math.min(100,Math.max(1,parseInt(limit)));
    const total = txs.length;
    return send(res, 200, { success:true, transactions:txs.slice((pg-1)*lm, pg*lm).map(fmtTx), totalCount:total, page:pg, totalPages:Math.ceil(total/lm)||1, limit:lm, summary:{ incomePaise:inc, incomeRupees:p2r(inc), expensePaise:exp, expenseRupees:p2r(exp), netPaise:inc-exp, netRupees:p2r(inc-exp) } });
  }

  const txMatch = path.match(/^\/api\/transactions\/([^/]+)$/);
  if (txMatch) {
    const user = getAuth(req);
    if (!user) return send(res, 401, { success:false, message:'Authentication required.' });
    const txId = txMatch[1];
    const txs = getTxs(user.id);

    if (method === 'GET') {
      const tx = txs.find(t => t.id === txId);
      if (!tx) return send(res, 404, { success:false, message:'Transaction not found' });
      return send(res, 200, { success:true, transaction:fmtTx(tx) });
    }
    if (method === 'PATCH' || method === 'PUT') {
      const idx = txs.findIndex(t => t.id === txId);
      if (idx === -1) return send(res, 404, { success:false, message:'Transaction not found' });
      const { type, amount, category, date, description, paymentMethod, notes } = await readBody(req);
      txs[idx] = { ...txs[idx], type, amountPaise:r2p(amount), category, date, description, paymentMethod, notes:notes||'' };
      return send(res, 200, { success:true, transaction:fmtTx(txs[idx]) });
    }
    if (method === 'DELETE') {
      const idx = txs.findIndex(t => t.id === txId);
      if (idx === -1) return send(res, 404, { success:false, message:'Transaction not found' });
      txs.splice(idx, 1);
      return send(res, 200, { success:true, message:'Transaction deleted' });
    }
  }

  if (path === '/api/transactions' && method === 'POST') {
    const user = getAuth(req);
    if (!user) return send(res, 401, { success:false, message:'Authentication required.' });
    const { type, amount, category, date, description, paymentMethod, notes } = await readBody(req);
    if (!type||!amount||!category||!date||!description||!paymentMethod) return send(res, 400, { success:false, message:'All fields required.' });
    const tx = { id:newId(), userId:user.id, type, amountPaise:r2p(amount), category, date, description, paymentMethod, notes:notes||'' };
    getTxs(user.id).push(tx);
    return send(res, 201, { success:true, transaction:fmtTx(tx) });
  }

  // ── Budgets ─────────────────────────────────────────────────────────────────
  if (path === '/api/budgets' && method === 'GET') {
    const user = getAuth(req);
    if (!user) return send(res, 401, { success:false, message:'Authentication required.' });
    const { month, year } = Object.fromEntries(url.searchParams);
    if (!month||!year) return send(res, 400, { success:false, message:'Month and year required.' });
    const y=parseInt(year), m=parseInt(month);
    const budget = getBudgets(user.id).get(`${y}_${m}`) || { year:y, month:m, totalLimitPaise:0, categoryAllocations:[] };
    const pfx = `${y}-${pad(m)}`;
    const monthExp = getTxs(user.id).filter(t=>t.date.startsWith(pfx)&&t.type==='expense');
    const spentPaise = monthExp.reduce((s,t)=>s+t.amountPaise,0);
    const catSpend = {};
    monthExp.forEach(t=>{ catSpend[t.category]=(catSpend[t.category]||0)+t.amountPaise; });
    return send(res, 200, { success:true, data:{ year:y, month:m, totalLimitPaise:budget.totalLimitPaise, totalLimitRupees:p2r(budget.totalLimitPaise), totalSpentPaise:spentPaise, totalSpentRupees:p2r(spentPaise), totalRemainingPaise:budget.totalLimitPaise-spentPaise, totalRemainingRupees:p2r(budget.totalLimitPaise-spentPaise), percentUsed:budget.totalLimitPaise>0?Math.round(spentPaise/budget.totalLimitPaise*100):0, isOverBudget:spentPaise>budget.totalLimitPaise, hasBudget:budget.totalLimitPaise>0, categoryAllocations:budget.categoryAllocations.map(a=>({ category:a.category, limitPaise:a.limitPaise, limitRupees:p2r(a.limitPaise), spentPaise:catSpend[a.category]||0, spentRupees:p2r(catSpend[a.category]||0), remainingPaise:a.limitPaise-(catSpend[a.category]||0), percentUsed:a.limitPaise>0?Math.round((catSpend[a.category]||0)/a.limitPaise*100):0, isOverBudget:(catSpend[a.category]||0)>a.limitPaise })) } });
  }

  const budgetMatch = path.match(/^\/api\/budgets\/(\d+)\/(\d+)$/);
  if (budgetMatch && method === 'PUT') {
    const user = getAuth(req);
    if (!user) return send(res, 401, { success:false, message:'Authentication required.' });
    const y=parseInt(budgetMatch[1]), m=parseInt(budgetMatch[2]);
    const { totalLimit, categoryAllocations=[] } = await readBody(req);
    if (!totalLimit) return send(res, 400, { success:false, message:'totalLimit required.' });
    const b = { year:y, month:m, totalLimitPaise:r2p(totalLimit), categoryAllocations:categoryAllocations.map(a=>({ category:a.category, limitPaise:r2p(a.limit) })) };
    if (!userBudgets.has(user.id)) userBudgets.set(user.id, new Map());
    userBudgets.get(user.id).set(`${y}_${m}`, b);
    return send(res, 200, { success:true, message:'Budget saved', data:b });
  }

  // ── Dashboard ───────────────────────────────────────────────────────────────
  if (path === '/api/dashboard' && method === 'GET') {
    const user = getAuth(req);
    if (!user) return send(res, 401, { success:false, message:'Authentication required.' });
    let { month='10', year='2026' } = Object.fromEntries(url.searchParams);
    const y=parseInt(year), m=parseInt(month);
    const pfx = `${y}-${pad(m)}`;
    const txs = getTxs(user.id);
    const mTxs = txs.filter(t=>t.date.startsWith(pfx));
    const inc = mTxs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amountPaise,0);
    const exp = mTxs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amountPaise,0);
    const budget = getBudgets(user.id).get(`${y}_${m}`);
    const lim = budget?.totalLimitPaise||0;
    const trend = [];
    for (let i=5;i>=0;i--) {
      let tm=m-i, ty=y; while(tm<1){tm+=12;ty--;} 
      const tp=`${ty}-${pad(tm)}`;
      const mt=txs.filter(t=>t.date.startsWith(tp));
      trend.push({ year:ty, month:tm, incomePaise:mt.filter(t=>t.type==='income').reduce((s,t)=>s+t.amountPaise,0), expensePaise:mt.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amountPaise,0) });
    }
    const catMap={};
    mTxs.filter(t=>t.type==='expense').forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+t.amountPaise;});
    const catBreakdown=Object.entries(catMap).map(([category,paise])=>({ category, amountPaise:paise, amountRupees:p2r(paise), percentage:exp>0?Math.round(paise/exp*100):0 })).sort((a,b)=>b.amountPaise-a.amountPaise);
    return send(res, 200, { success:true, data:{ summary:{ incomePaise:inc, incomeRupees:p2r(inc), expensePaise:exp, expenseRupees:p2r(exp), netPaise:inc-exp, netRupees:p2r(inc-exp), budgetLimitPaise:lim, budgetLimitRupees:p2r(lim), budgetRemainingPaise:lim-exp, budgetRemainingRupees:p2r(lim-exp), budgetPercentUsed:lim>0?Math.round(exp/lim*100):0, transactionCount:mTxs.length }, sixMonthTrend:trend, categoryBreakdown:catBreakdown } });
  }

  // ── Insights ────────────────────────────────────────────────────────────────
  if (path === '/api/insights' && method === 'GET') {
    const user = getAuth(req);
    if (!user) return send(res, 401, { success:false, message:'Authentication required.' });
    let { month='10', year='2026' } = Object.fromEntries(url.searchParams);
    const y=parseInt(year), m=parseInt(month);
    const pfx=`${y}-${pad(m)}`;
    const txs=getTxs(user.id);
    const expTxs=txs.filter(t=>t.date.startsWith(pfx)&&t.type==='expense');
    const totalExp=expTxs.reduce((s,t)=>s+t.amountPaise,0);
    let pm=m-1, py=y; if(pm<1){pm=12;py--;}
    const prevExp=txs.filter(t=>t.date.startsWith(`${py}-${pad(pm)}`)&&t.type==='expense').reduce((s,t)=>s+t.amountPaise,0);
    const catMap={};
    expTxs.forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+t.amountPaise;});
    const topCats=Object.entries(catMap).map(([category,paise])=>({ category, amountPaise:paise, amountRupees:p2r(paise), percentage:totalExp>0?Math.round(paise/totalExp*100):0 })).sort((a,b)=>b.amountPaise-a.amountPaise);
    const budget=getBudgets(user.id).get(`${y}_${m}`);
    const overBudget=budget?budget.categoryAllocations.filter(a=>(catMap[a.category]||0)>a.limitPaise).map(a=>({ category:a.category, limitPaise:a.limitPaise, spentPaise:catMap[a.category]||0, overByPaise:(catMap[a.category]||0)-a.limitPaise })):[];
    return send(res, 200, { success:true, data:{ totalExpensePaise:totalExp, totalExpenseRupees:p2r(totalExp), prevMonthExpensePaise:prevExp, prevMonthExpenseRupees:p2r(prevExp), monthOverMonthChange:prevExp>0?Math.round((totalExp-prevExp)/prevExp*100):0, topCategories:topCats, overBudgetCategories:overBudget, transactionCount:expTxs.length } });
  }

  return send(res, 404, { success:false, message:'Not found' });
};
