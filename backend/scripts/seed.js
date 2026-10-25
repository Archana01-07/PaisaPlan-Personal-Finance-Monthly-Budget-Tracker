require('dotenv').config();
const path = require('path');
const os = require('os');
const fs = require('fs');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Transaction = require('../src/models/Transaction');
const Budget = require('../src/models/Budget');
const { rupeesToPaise } = require('../src/utils/currency');

const DEMO_EMAIL = 'demo@paisaplan.com';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo@12345';
const DEMO_NAME = 'Sriman Student';

// If no MONGODB_URI configured, try to read the running server URI from temp file
if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('localhost')) {
  const uriFile = path.join(os.tmpdir(), 'paisaplan-db-uri.txt');
  if (fs.existsSync(uriFile)) {
    let savedUri = fs.readFileSync(uriFile, 'utf8').trim();
    if (savedUri) {
      if (!savedUri.includes('/paisaplan')) {
        savedUri = savedUri.replace(/\/+$/, '') + '/paisaplan';
      }
      console.log(`Using running server URI from temp file: ${savedUri}`);
      process.env.MONGODB_URI = savedUri;
    }
  }
}

async function seed(options = {}) {
  const { disconnectOnFinish = true } = options;
  console.log('--- Starting PaisaPlan Demo Seed ---');
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  try {
    // 1. Find or create demo user
    let user = await User.findOne({ email: DEMO_EMAIL });
    const passwordHash = await User.hashPassword(DEMO_PASSWORD);

    if (user) {
      console.log(`Demo user ${DEMO_EMAIL} found. Updating password...`);
      user.passwordHash = passwordHash;
      user.name = DEMO_NAME;
      await user.save();
    } else {
      console.log(`Creating demo user ${DEMO_EMAIL}...`);
      user = await User.create({
        name: DEMO_NAME,
        email: DEMO_EMAIL,
        passwordHash,
      });
    }

    const userId = user._id;

    // 2. Clear existing records for demo user to ensure idempotency
    console.log('Clearing previous records for demo user...');
    await Promise.all([
      Transaction.deleteMany({ userId }),
      Budget.deleteMany({ userId }),
    ]);

    // 3. Create September 2026 Budget (Total: ₹25,500)
    console.log('Creating September 2026 Monthly Budget...');
    await Budget.create({
      userId,
      year: 2026,
      month: 9,
      totalLimitPaise: rupeesToPaise(25500),
      categoryAllocations: [
        { category: 'Rent / Hostel', limitPaise: rupeesToPaise(8500) },
        { category: 'Food & dining', limitPaise: rupeesToPaise(4000) },
        { category: 'Transport', limitPaise: rupeesToPaise(2500) },
        { category: 'Books & supplies', limitPaise: rupeesToPaise(2000) },
        { category: 'Entertainment', limitPaise: rupeesToPaise(1500) },
        { category: 'Subscriptions', limitPaise: rupeesToPaise(700) },
        { category: 'Mobile recharge', limitPaise: rupeesToPaise(500) },
        { category: 'Other', limitPaise: rupeesToPaise(5800) },
      ],
    });

    // 4. Create September 2026 Transactions
    console.log('Seeding September 2026 Transactions...');
    const septTransactions = [
      // Income (Total: ₹32,000)
      {
        userId,
        type: 'income',
        amountPaise: rupeesToPaise(20000),
        category: 'Allowance',
        date: '2026-09-01',
        description: 'Monthly Allowance from Parents',
        paymentMethod: 'Bank transfer',
        notes: 'Hostel and living allowance for semester start',
      },
      {
        userId,
        type: 'income',
        amountPaise: rupeesToPaise(12000),
        category: 'Freelance',
        date: '2026-09-15',
        description: 'Web Development Project Honorarium',
        paymentMethod: 'UPI',
        notes: 'Front-end landing page project payout',
      },

      // Rent / Hostel (Total: ₹8,500)
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(8500),
        category: 'Rent / Hostel',
        date: '2026-09-02',
        description: 'Campus Hostel & Mess Advance',
        paymentMethod: 'Bank transfer',
        notes: 'Monthly room and dining fees',
      },

      // Food & dining (Total: ₹4,280 -> ₹280 over budget, 107% used)
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(650),
        category: 'Food & dining',
        date: '2026-09-03',
        description: 'Campus Cafeteria Weekly Meal Pack',
        paymentMethod: 'UPI',
        notes: 'Lunch coupons',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(1240),
        category: 'Food & dining',
        date: '2026-09-08',
        description: 'Supermarket Grocery Store',
        paymentMethod: 'Debit card',
        notes: 'Oats, milk, almonds, fruits',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(780),
        category: 'Food & dining',
        date: '2026-09-14',
        description: 'Weekend Dinner with Study Group',
        paymentMethod: 'UPI',
        notes: 'Shared pizza and drinks',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(960),
        category: 'Food & dining',
        date: '2026-09-20',
        description: 'Fresh Produce & Healthy Snacks',
        paymentMethod: 'UPI',
        notes: 'Weekly pantry restock',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(650),
        category: 'Food & dining',
        date: '2026-09-26',
        description: 'College Canteen Evening Snacks',
        paymentMethod: 'Cash',
        notes: 'Tea, sandwiches during project meet',
      },

      // Transport (Total: ₹2,140 -> ₹360 remaining)
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(850),
        category: 'Transport',
        date: '2026-09-04',
        description: 'Monthly Metro SmartCard Recharge',
        paymentMethod: 'UPI',
        notes: 'Metro pass for commuting',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(420),
        category: 'Transport',
        date: '2026-09-11',
        description: 'Auto Rickshaw to Central Library',
        paymentMethod: 'UPI',
        notes: 'Book return & study session',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(390),
        category: 'Transport',
        date: '2026-09-18',
        description: 'Ride Share to City Center',
        paymentMethod: 'UPI',
        notes: 'Hardware component pickup',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(480),
        category: 'Transport',
        date: '2026-09-25',
        description: 'Local Bus Transit & Train Fare',
        paymentMethod: 'Cash',
        notes: 'Weekend trip transit',
      },

      // Books & supplies (Total: ₹1,240)
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(790),
        category: 'Books & supplies',
        date: '2026-09-05',
        description: 'Algorithms & Data Structures Textbook',
        paymentMethod: 'UPI',
        notes: 'Course reference material',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(450),
        category: 'Books & supplies',
        date: '2026-09-16',
        description: 'Notebooks, Pens & Lab File Bindings',
        paymentMethod: 'Cash',
        notes: 'Midterm submission supplies',
      },

      // Entertainment (Total: ₹1,320)
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(520),
        category: 'Entertainment',
        date: '2026-09-10',
        description: 'Weekend Movie Ticket at Cinema',
        paymentMethod: 'UPI',
        notes: 'Friday night movie',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(800),
        category: 'Entertainment',
        date: '2026-09-22',
        description: 'Board Game Cafe with Friends',
        paymentMethod: 'Debit card',
        notes: 'Afternoon social event',
      },

      // Subscriptions (Total: ₹408)
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(209),
        category: 'Subscriptions',
        date: '2026-09-07',
        description: 'Spotify Student Subscription',
        paymentMethod: 'Credit card',
        notes: 'Monthly recurring streaming',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(199),
        category: 'Subscriptions',
        date: '2026-09-15',
        description: 'Google One Cloud Storage 100GB',
        paymentMethod: 'UPI',
        notes: 'Project backup storage',
      },

      // Mobile recharge (Total: ₹349)
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(349),
        category: 'Mobile recharge',
        date: '2026-09-06',
        description: 'Prepaid 28-Day Data Pack Recharge',
        paymentMethod: 'UPI',
        notes: 'Unlimited calling + 2GB/day',
      },

      // Other (Total: ₹303)
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(150),
        category: 'Other',
        date: '2026-09-12',
        description: 'Hostel Laundry & Ironing Service',
        paymentMethod: 'Cash',
        notes: 'Fortnightly wash',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(153),
        category: 'Other',
        date: '2026-09-24',
        description: 'Photocopying & Lab Assignment Printouts',
        paymentMethod: 'UPI',
        notes: 'Project documentation spiral bind',
      },
    ];

    await Transaction.insertMany(septTransactions);

    // 4.1 Create October 2026 Budget (Current Active Month: Total: ₹26,000)
    console.log('Creating October 2026 Monthly Budget...');
    await Budget.create({
      userId,
      year: 2026,
      month: 10,
      totalLimitPaise: rupeesToPaise(26000),
      categoryAllocations: [
        { category: 'Rent / Hostel', limitPaise: rupeesToPaise(8500) },
        { category: 'Food & dining', limitPaise: rupeesToPaise(4500) },
        { category: 'Transport', limitPaise: rupeesToPaise(2500) },
        { category: 'Books & supplies', limitPaise: rupeesToPaise(2000) },
        { category: 'Entertainment', limitPaise: rupeesToPaise(1500) },
        { category: 'Subscriptions', limitPaise: rupeesToPaise(700) },
        { category: 'Mobile recharge', limitPaise: rupeesToPaise(500) },
        { category: 'Other', limitPaise: rupeesToPaise(5800) },
      ],
    });

    // 4.2 Create October 2026 Transactions
    console.log('Seeding October 2026 Transactions (Current Month)...');
    const octTransactions = [
      {
        userId,
        type: 'income',
        amountPaise: rupeesToPaise(22000),
        category: 'Allowance',
        date: '2026-10-01',
        description: 'Monthly Allowance from Parents',
        paymentMethod: 'Bank transfer',
        notes: 'Hostel and living allowance for October',
      },
      {
        userId,
        type: 'income',
        amountPaise: rupeesToPaise(14000),
        category: 'Freelance',
        date: '2026-10-14',
        description: 'React Dashboard UI Project Payout',
        paymentMethod: 'UPI',
        notes: 'Freelance client payment',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(8500),
        category: 'Rent / Hostel',
        date: '2026-10-02',
        description: 'Campus Hostel & Mess Advance',
        paymentMethod: 'Bank transfer',
        notes: 'Room fee October',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(980),
        category: 'Food & dining',
        date: '2026-10-04',
        description: 'Supermarket Groceries & Fruits',
        paymentMethod: 'Debit card',
        notes: 'Monthly staples and healthy food',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(349),
        category: 'Mobile recharge',
        date: '2026-10-06',
        description: 'Prepaid Data Plan Recharge',
        paymentMethod: 'UPI',
        notes: '28-day 5G data plan',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(209),
        category: 'Subscriptions',
        date: '2026-10-07',
        description: 'Spotify Student Premium',
        paymentMethod: 'Credit card',
        notes: 'Monthly music streaming',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(850),
        category: 'Transport',
        date: '2026-10-09',
        description: 'Metro SmartCard Top-up',
        paymentMethod: 'UPI',
        notes: 'Monthly transit pass',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(1200),
        category: 'Food & dining',
        date: '2026-10-12',
        description: 'Study Group Dinner & Cafeteria',
        paymentMethod: 'UPI',
        notes: 'Team project dinner',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(1150),
        category: 'Books & supplies',
        date: '2026-10-15',
        description: 'Distributed Systems & Cloud Textbook',
        paymentMethod: 'Debit card',
        notes: 'Semester reference book',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(199),
        category: 'Subscriptions',
        date: '2026-10-16',
        description: 'Cloud Storage 100GB',
        paymentMethod: 'UPI',
        notes: 'Project code & thesis backup',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(420),
        category: 'Transport',
        date: '2026-10-18',
        description: 'Cab Ride to Tech Seminar',
        paymentMethod: 'UPI',
        notes: 'Campus commute',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(840),
        category: 'Food & dining',
        date: '2026-10-21',
        description: 'Campus Canteen & Weekend Snacks',
        paymentMethod: 'Cash',
        notes: 'Weekly snacks',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(750),
        category: 'Entertainment',
        date: '2026-10-23',
        description: 'Movie Night & Popcorn',
        paymentMethod: 'UPI',
        notes: 'Weekend relax',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(280),
        category: 'Other',
        date: '2026-10-24',
        description: 'Stationery & Project Printing',
        paymentMethod: 'UPI',
        notes: 'Sprint report documentation',
      },
    ];
    await Transaction.insertMany(octTransactions);

    // 5. Create August 2026 Data (Total: ₹18,040 -> so Sept spending is exactly ₹500 more than August!)
    console.log('Seeding August 2026 transactions for trend and comparison...');
    await Budget.create({
      userId,
      year: 2026,
      month: 8,
      totalLimitPaise: rupeesToPaise(25000),
      categoryAllocations: [
        { category: 'Rent / Hostel', limitPaise: rupeesToPaise(8500) },
        { category: 'Food & dining', limitPaise: rupeesToPaise(4000) },
        { category: 'Transport', limitPaise: rupeesToPaise(2500) },
        { category: 'Books & supplies', limitPaise: rupeesToPaise(2000) },
        { category: 'Entertainment', limitPaise: rupeesToPaise(1500) },
        { category: 'Subscriptions', limitPaise: rupeesToPaise(700) },
        { category: 'Mobile recharge', limitPaise: rupeesToPaise(500) },
        { category: 'Other', limitPaise: rupeesToPaise(5300) },
      ],
    });

    const augTransactions = [
      {
        userId,
        type: 'income',
        amountPaise: rupeesToPaise(30000),
        category: 'Allowance',
        date: '2026-08-01',
        description: 'Monthly Allowance',
        paymentMethod: 'Bank transfer',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(8500),
        category: 'Rent / Hostel',
        date: '2026-08-02',
        description: 'Hostel Rent',
        paymentMethod: 'Bank transfer',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(3900),
        category: 'Food & dining',
        date: '2026-08-10',
        description: 'Monthly Groceries & Dining',
        paymentMethod: 'UPI',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(2000),
        category: 'Transport',
        date: '2026-08-05',
        description: 'Metro Card Pass',
        paymentMethod: 'UPI',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(1400),
        category: 'Books & supplies',
        date: '2026-08-12',
        description: 'Semester Reference Guides',
        paymentMethod: 'Debit card',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(1100),
        category: 'Entertainment',
        date: '2026-08-20',
        description: 'Weekend Outing',
        paymentMethod: 'Cash',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(408),
        category: 'Subscriptions',
        date: '2026-08-07',
        description: 'Monthly Digital Subscriptions',
        paymentMethod: 'Credit card',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(349),
        category: 'Mobile recharge',
        date: '2026-08-06',
        description: 'Mobile Recharge',
        paymentMethod: 'UPI',
      },
      {
        userId,
        type: 'expense',
        amountPaise: rupeesToPaise(383),
        category: 'Other',
        date: '2026-08-25',
        description: 'Laundry & Miscellaneous',
        paymentMethod: 'Cash',
      },
    ];
    await Transaction.insertMany(augTransactions);

    // 6. Earlier months for the 6-month trend chart (April, May, June, July 2026)
    const earlierMonths = [
      { y: 2026, m: 4, inc: 28000, exp: 17200, date: '2026-04-15' },
      { y: 2026, m: 5, inc: 29000, exp: 16800, date: '2026-05-15' },
      { y: 2026, m: 6, inc: 31000, exp: 17900, date: '2026-06-15' },
      { y: 2026, m: 7, inc: 30000, exp: 17400, date: '2026-07-15' },
    ];

    for (const em of earlierMonths) {
      await Transaction.insertMany([
        {
          userId,
          type: 'income',
          amountPaise: rupeesToPaise(em.inc),
          category: 'Allowance',
          date: em.date,
          description: 'Monthly Income',
          paymentMethod: 'Bank transfer',
        },
        {
          userId,
          type: 'expense',
          amountPaise: rupeesToPaise(em.exp),
          category: 'Food & dining',
          date: em.date,
          description: 'Monthly Living Expenses',
          paymentMethod: 'UPI',
        },
      ]);
    }

    console.log('\n===============================================');
    console.log(' PaisaPlan Demo Dataset Seeded Successfully! ');
    console.log('===============================================');
    console.log(`Demo Account: ${DEMO_EMAIL}`);
    console.log(`Demo Password: ${DEMO_PASSWORD}`);
    console.log('Target Month: September 2026');
    console.log('Total Income: ₹32,000');
    console.log('Total Expenses: ₹18,540');
    console.log('Monthly Balance: ₹13,460');
    console.log('Monthly Budget: ₹25,500 (Remaining: ₹6,960)');
    console.log('Food & Dining: ₹4,280 (107% used, ₹280 over budget)');
    console.log('Transport: ₹2,140 (₹360 remaining)');
    console.log('August 2026 Expenses: ₹18,040 (September spent ₹500 more)');
    console.log('October 2026 Expenses: ₹15,727 (Current active month)');
    console.log('===============================================\n');
  } catch (err) {
    console.error('Error during demo seeding:', err);
    if (disconnectOnFinish) {
      process.exit(1);
    }
    throw err;
  } finally {
    if (disconnectOnFinish) {
      await disconnectDB();
    }
  }
}

async function ensureSeeded() {
  try {
    const demoUser = await User.findOne({ email: DEMO_EMAIL });
    const txCount = demoUser ? await Transaction.countDocuments({ userId: demoUser._id }) : 0;
    if (!demoUser || txCount === 0) {
      console.log('Demo user or transactions missing. Auto-seeding demo dataset...');
      await seed({ disconnectOnFinish: false });
    } else {
      const passwordHash = await User.hashPassword(DEMO_PASSWORD);
      demoUser.passwordHash = passwordHash;
      await demoUser.save();
      console.log(`Demo user verified and active: ${DEMO_EMAIL}`);
    }
  } catch (err) {
    console.error('Notice: Auto-seed check error:', err.message);
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed, ensureSeeded, DEMO_EMAIL, DEMO_PASSWORD };
