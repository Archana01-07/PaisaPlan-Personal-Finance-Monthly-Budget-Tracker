// Vitest globals enabled
const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Transaction = require('../src/models/Transaction');
const Budget = require('../src/models/Budget');

let userACookie = null;
let userBCookie = null;
let userAId = null;
let userBId = null;

beforeAll(async () => {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Transaction.deleteMany({}),
    Budget.deleteMany({}),
  ]);

  // Register User A
  const resA = await request(app).post('/api/auth/register').send({
    name: 'User Alpha',
    email: 'userA@test.com',
    password: 'Password@123',
    confirmPassword: 'Password@123',
  });
  expect(resA.status).toBe(201);
  userACookie = resA.headers['set-cookie'];
  userAId = resA.body.user.id;

  // Register User B
  const resB = await request(app).post('/api/auth/register').send({
    name: 'User Beta',
    email: 'userB@test.com',
    password: 'Password@123',
    confirmPassword: 'Password@123',
  });
  expect(resB.status).toBe(201);
  userBCookie = resB.headers['set-cookie'];
  userBId = resB.body.user.id;
});

afterAll(async () => {
  await disconnectDB();
});

describe('Authentication & Security', () => {
  it('rejects duplicate email registration', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Duplicate Alpha',
      email: 'userA@test.com',
      password: 'Password@123',
      confirmPassword: 'Password@123',
    });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects incorrect login credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'userA@test.com',
      password: 'WrongPassword!',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('allows login with correct credentials and returns session cookie', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'userA@test.com',
      password: 'Password@123',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects protected endpoints when unauthenticated', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(401);
  });
});

describe('Data Ownership and User Isolation', () => {
  let userATransactionId = null;

  it('allows User A to create a transaction', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Cookie', userACookie)
      .send({
        type: 'expense',
        amount: 500,
        category: 'Food & dining',
        date: '2026-09-10',
        description: 'Alpha Lunch',
        paymentMethod: 'UPI',
        notes: 'Strictly private',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    userATransactionId = res.body.transaction.id;
    expect(res.body.transaction.amountRupees).toBe(500);
    expect(res.body.transaction.amountPaise).toBe(50000);
  });

  it('prevents User B from accessing User A transaction', async () => {
    const res = await request(app)
      .get(`/api/transactions/${userATransactionId}`)
      .set('Cookie', userBCookie);

    expect(res.status).toBe(404);
  });

  it('prevents User B from updating User A transaction', async () => {
    const res = await request(app)
      .patch(`/api/transactions/${userATransactionId}`)
      .set('Cookie', userBCookie)
      .send({
        type: 'expense',
        amount: 999,
        category: 'Food & dining',
        date: '2026-09-10',
        description: 'Hacked by Beta',
        paymentMethod: 'Cash',
      });

    expect(res.status).toBe(404);

    // Verify User A transaction is unchanged
    const verifyRes = await request(app)
      .get(`/api/transactions/${userATransactionId}`)
      .set('Cookie', userACookie);
    expect(verifyRes.body.transaction.description).toBe('Alpha Lunch');
    expect(verifyRes.body.transaction.amountRupees).toBe(500);
  });

  it('prevents User B from deleting User A transaction', async () => {
    const res = await request(app)
      .delete(`/api/transactions/${userATransactionId}`)
      .set('Cookie', userBCookie);

    expect(res.status).toBe(404);
  });

  it('ensures User B transaction list does not show User A records', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Cookie', userBCookie);

    expect(res.status).toBe(200);
    expect(res.body.transactions.length).toBe(0);
  });
});
