const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { getMonthBounds, getElapsedDays, getDaysInMonth, MONTH_NAMES } = require('../utils/dates');
const { formatINR, paiseToRupees } = require('../utils/currency');
const { EXPENSE_CATEGORIES } = require('../config/constants');

/**
 * Authoritative financial calculation service for PaisaPlan.
 * All computations use integer paise internally.
 */

async function getMonthlySummary(userId, year, month) {
  const { startDate, endDate } = getMonthBounds(year, month);

  // Fetch all transactions for the user in the selected month
  const transactions = await Transaction.find({
    userId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: -1, createdAt: -1 });

  let incomePaise = 0;
  let expensePaise = 0;
  const categorySpendingMap = {};

  for (const t of transactions) {
    if (t.type === 'income') {
      incomePaise += t.amountPaise;
    } else if (t.type === 'expense') {
      expensePaise += t.amountPaise;
      categorySpendingMap[t.category] = (categorySpendingMap[t.category] || 0) + t.amountPaise;
    }
  }

  const balancePaise = incomePaise - expensePaise;

  // Fetch budget for the user for the month
  const budget = await Budget.findOne({ userId, year, month });

  let budgetSummary = null;
  if (budget) {
    const totalLimitPaise = budget.totalLimitPaise;
    const remainingPaise = totalLimitPaise - expensePaise;
    const percentageUsed = totalLimitPaise > 0 
      ? Math.round((expensePaise / totalLimitPaise) * 100) 
      : 0;

    let status = 'Within budget';
    if (expensePaise > totalLimitPaise) {
      status = 'Over budget';
    } else if (percentageUsed >= 80) {
      status = 'Approaching limit';
    }

    budgetSummary = {
      hasBudget: true,
      totalLimitPaise,
      totalLimitRupees: paiseToRupees(totalLimitPaise),
      spentPaise: expensePaise,
      spentRupees: paiseToRupees(expensePaise),
      remainingPaise,
      remainingRupees: paiseToRupees(remainingPaise),
      percentageUsed,
      status,
    };
  } else {
    budgetSummary = {
      hasBudget: false,
      message: 'Set a monthly budget',
    };
  }

  return {
    year: parseInt(year, 10),
    month: parseInt(month, 10),
    incomePaise,
    incomeRupees: paiseToRupees(incomePaise),
    expensePaise,
    expenseRupees: paiseToRupees(expensePaise),
    balancePaise,
    balanceRupees: paiseToRupees(balancePaise),
    categorySpendingMap,
    budget: budgetSummary,
    transactionCount: transactions.length,
    recentTransactions: transactions.slice(0, 5),
  };
}

async function getSixMonthTrend(userId, targetYear, targetMonth) {
  const result = [];
  let currY = parseInt(targetYear, 10);
  let currM = parseInt(targetMonth, 10);

  // Collect the 6 months in chronological order ending at (currY, currM)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    let y = currY;
    let m = currM - i;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    months.push({ year: y, month: m });
  }

  for (const { year, month } of months) {
    const { startDate, endDate } = getMonthBounds(year, month);
    const agg = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$type',
          totalPaise: { $sum: '$amountPaise' },
        },
      },
    ]);

    let incomePaise = 0;
    let expensePaise = 0;
    for (const item of agg) {
      if (item._id === 'income') incomePaise = item.totalPaise;
      if (item._id === 'expense') expensePaise = item.totalPaise;
    }

    const shortMonth = MONTH_NAMES[month - 1].substring(0, 3);
    result.push({
      year,
      month,
      label: `${shortMonth} ${year}`,
      shortMonth,
      incomePaise,
      incomeRupees: paiseToRupees(incomePaise),
      expensePaise,
      expenseRupees: paiseToRupees(expensePaise),
    });
  }

  return result;
}

async function getCategoryBreakdown(userId, year, month) {
  const { startDate, endDate } = getMonthBounds(year, month);

  const agg = await Transaction.aggregate([
    {
      $match: {
        userId,
        type: 'expense',
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$category',
        totalPaise: { $sum: '$amountPaise' },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalPaise: -1 } },
  ]);

  const totalExpensePaise = agg.reduce((acc, curr) => acc + curr.totalPaise, 0);

  return agg.map((item) => {
    const percentage = totalExpensePaise > 0 
      ? Math.round((item.totalPaise / totalExpensePaise) * 100) 
      : 0;
    return {
      category: item._id,
      amountPaise: item.totalPaise,
      amountRupees: paiseToRupees(item.totalPaise),
      percentage,
      transactionCount: item.count,
    };
  });
}

async function getDetailedBudgetStatus(userId, year, month) {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const { startDate, endDate } = getMonthBounds(y, m);

  const [budget, expenseAgg] = await Promise.all([
    Budget.findOne({ userId, year: y, month: m }),
    Transaction.aggregate([
      {
        $match: {
          userId,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          totalPaise: { $sum: '$amountPaise' },
        },
      },
    ]),
  ]);

  const spendingMap = {};
  let totalSpentPaise = 0;
  for (const item of expenseAgg) {
    spendingMap[item._id] = item.totalPaise;
    totalSpentPaise += item.totalPaise;
  }

  if (!budget) {
    // Return unbudgeted category spendings if transactions exist
    const unallocatedCategories = expenseAgg.map((item) => ({
      category: item._id,
      allocatedPaise: 0,
      allocatedRupees: 0,
      spentPaise: item.totalPaise,
      spentRupees: paiseToRupees(item.totalPaise),
      remainingPaise: -item.totalPaise,
      remainingRupees: paiseToRupees(-item.totalPaise),
      percentageUsed: 100,
      progressPercent: 100,
      status: 'Over budget',
      isUnallocated: true,
    }));

    return {
      hasBudget: false,
      year: y,
      month: m,
      totalLimitPaise: 0,
      totalLimitRupees: 0,
      totalSpentPaise,
      totalSpentRupees: paiseToRupees(totalSpentPaise),
      remainingPaise: -totalSpentPaise,
      remainingRupees: paiseToRupees(-totalSpentPaise),
      percentageUsed: 0,
      unallocatedBudgetPaise: 0,
      unallocatedBudgetRupees: 0,
      categories: unallocatedCategories,
    };
  }

  let totalAllocatedPaise = 0;
  const allocatedCategoriesSet = new Set();

  const categories = budget.categoryAllocations.map((alloc) => {
    allocatedCategoriesSet.add(alloc.category);
    totalAllocatedPaise += alloc.limitPaise;
    const spentPaise = spendingMap[alloc.category] || 0;
    const remainingPaise = alloc.limitPaise - spentPaise;
    const percentageUsed = alloc.limitPaise > 0 
      ? Math.round((spentPaise / alloc.limitPaise) * 100) 
      : (spentPaise > 0 ? 100 : 0);

    let status = 'Within budget';
    if (spentPaise > alloc.limitPaise) {
      status = 'Over budget';
    } else if (percentageUsed >= 80) {
      status = 'Approaching limit';
    }

    return {
      category: alloc.category,
      allocatedPaise: alloc.limitPaise,
      allocatedRupees: paiseToRupees(alloc.limitPaise),
      spentPaise,
      spentRupees: paiseToRupees(spentPaise),
      remainingPaise,
      remainingRupees: paiseToRupees(remainingPaise),
      percentageUsed,
      progressPercent: Math.min(100, Math.max(0, percentageUsed)),
      status,
      isUnallocated: false,
    };
  });

  // Check for categories with spending that were NOT in the allocation list
  for (const [category, spentPaise] of Object.entries(spendingMap)) {
    if (!allocatedCategoriesSet.has(category)) {
      categories.push({
        category,
        allocatedPaise: 0,
        allocatedRupees: 0,
        spentPaise,
        spentRupees: paiseToRupees(spentPaise),
        remainingPaise: -spentPaise,
        remainingRupees: paiseToRupees(-spentPaise),
        percentageUsed: 100,
        progressPercent: 100,
        status: 'Over budget',
        isUnallocated: true,
      });
    }
  }

  const unallocatedBudgetPaise = Math.max(0, budget.totalLimitPaise - totalAllocatedPaise);
  const totalRemainingPaise = budget.totalLimitPaise - totalSpentPaise;
  const overallPercentageUsed = budget.totalLimitPaise > 0 
    ? Math.round((totalSpentPaise / budget.totalLimitPaise) * 100) 
    : 0;

  let overallStatus = 'Within budget';
  if (totalSpentPaise > budget.totalLimitPaise) {
    overallStatus = 'Over budget';
  } else if (overallPercentageUsed >= 80) {
    overallStatus = 'Approaching limit';
  }

  return {
    hasBudget: true,
    budgetId: budget._id,
    year: y,
    month: m,
    totalLimitPaise: budget.totalLimitPaise,
    totalLimitRupees: paiseToRupees(budget.totalLimitPaise),
    totalSpentPaise,
    totalSpentRupees: paiseToRupees(totalSpentPaise),
    remainingPaise: totalRemainingPaise,
    remainingRupees: paiseToRupees(totalRemainingPaise),
    percentageUsed: overallPercentageUsed,
    status: overallStatus,
    unallocatedBudgetPaise,
    unallocatedBudgetRupees: paiseToRupees(unallocatedBudgetPaise),
    categories,
  };
}

async function getSpendingInsights(userId, year, month) {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const { startDate, endDate, daysInMonth } = getMonthBounds(y, m);

  // Selected month transactions
  const currentMonthTransactions = await Transaction.find({
    userId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });

  let totalIncomePaise = 0;
  let totalExpensePaise = 0;
  let largestExpenseTransaction = null;
  const categorySpendingMap = {};

  // Initialize weekly buckets (5 weeks max)
  const weeklyBuckets = [
    { label: 'Week 1 (1st - 7th)', range: '01 - 07', amountPaise: 0 },
    { label: 'Week 2 (8th - 14th)', range: '08 - 14', amountPaise: 0 },
    { label: 'Week 3 (15th - 21st)', range: '15 - 21', amountPaise: 0 },
    { label: 'Week 4 (22nd - 28th)', range: '22 - 28', amountPaise: 0 },
    { label: `Week 5 (29th - ${daysInMonth}th)`, range: `29 - ${daysInMonth}`, amountPaise: 0 },
  ];

  for (const t of currentMonthTransactions) {
    if (t.type === 'income') {
      totalIncomePaise += t.amountPaise;
    } else if (t.type === 'expense') {
      totalExpensePaise += t.amountPaise;
      categorySpendingMap[t.category] = (categorySpendingMap[t.category] || 0) + t.amountPaise;

      if (!largestExpenseTransaction || t.amountPaise > largestExpenseTransaction.amountPaise) {
        largestExpenseTransaction = t;
      }

      // Assign to weekly bucket
      const day = parseInt(t.date.split('-')[2], 10);
      if (day <= 7) weeklyBuckets[0].amountPaise += t.amountPaise;
      else if (day <= 14) weeklyBuckets[1].amountPaise += t.amountPaise;
      else if (day <= 21) weeklyBuckets[2].amountPaise += t.amountPaise;
      else if (day <= 28) weeklyBuckets[3].amountPaise += t.amountPaise;
      else weeklyBuckets[4].amountPaise += t.amountPaise;
    }
  }

  // Format weekly buckets with rupees
  const weeklySpending = weeklyBuckets.map((b) => ({
    ...b,
    amountRupees: paiseToRupees(b.amountPaise),
  }));

  // Daily average spending
  const elapsedDays = getElapsedDays(y, m);
  const dailyAveragePaise = elapsedDays > 0 ? Math.round(totalExpensePaise / elapsedDays) : 0;

  // Monthly surplus rate = ((income - expenses) / income) * 100
  let monthlySurplusRate = null;
  if (totalIncomePaise > 0) {
    monthlySurplusRate = Number((((totalIncomePaise - totalExpensePaise) / totalIncomePaise) * 100).toFixed(1));
  }

  // Category ranking
  const categoryRankings = Object.entries(categorySpendingMap)
    .map(([category, amountPaise]) => ({
      category,
      amountPaise,
      amountRupees: paiseToRupees(amountPaise),
      percentage: totalExpensePaise > 0 ? Math.round((amountPaise / totalExpensePaise) * 100) : 0,
    }))
    .sort((a, b) => b.amountPaise - a.amountPaise);

  // Previous month comparison
  let prevM = m - 1;
  let prevY = y;
  if (prevM <= 0) {
    prevM = 12;
    prevY = y - 1;
  }
  const prevBounds = getMonthBounds(prevY, prevM);
  const prevExpenseAgg = await Transaction.aggregate([
    {
      $match: {
        userId,
        type: 'expense',
        date: { $gte: prevBounds.startDate, $lte: prevBounds.endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalPaise: { $sum: '$amountPaise' },
        count: { $sum: 1 },
      },
    },
  ]);

  let previousMonthComparison = null;
  if (prevExpenseAgg.length > 0 && prevExpenseAgg[0].count > 0) {
    const prevTotalPaise = prevExpenseAgg[0].totalPaise;
    const diffPaise = totalExpensePaise - prevTotalPaise;
    const percentChange = prevTotalPaise > 0 
      ? Number(((diffPaise / prevTotalPaise) * 100).toFixed(1)) 
      : 0;

    previousMonthComparison = {
      hasData: true,
      previousMonth: prevM,
      previousYear: prevY,
      previousMonthName: MONTH_NAMES[prevM - 1],
      previousTotalPaise: prevTotalPaise,
      previousTotalRupees: paiseToRupees(prevTotalPaise),
      differencePaise: diffPaise,
      differenceRupees: paiseToRupees(diffPaise),
      percentChange,
      isHigher: diffPaise > 0,
      isLower: diffPaise < 0,
      isEqual: diffPaise === 0,
    };
  } else {
    previousMonthComparison = {
      hasData: false,
      message: 'No recorded transaction data for the previous month to compare.',
    };
  }

  // Budget status for category remaining facts
  const budget = await Budget.findOne({ userId, year: y, month: m });

  // Generate data-backed observations
  const observations = [];

  if (categoryRankings.length > 0) {
    const top = categoryRankings[0];
    observations.push(
      `${top.category} is your highest spending category at ${formatINR(top.amountPaise)} (${top.percentage}% of monthly spending).`
    );
    if (categoryRankings.length > 1) {
      const second = categoryRankings[1];
      observations.push(
        `${second.category} is your second-largest spending category at ${formatINR(second.amountPaise)}.`
      );
    }
  }

  if (previousMonthComparison && previousMonthComparison.hasData) {
    const absDiff = formatINR(Math.abs(previousMonthComparison.differencePaise));
    if (previousMonthComparison.isHigher) {
      observations.push(`You spent ${absDiff} more than last month (${previousMonthComparison.previousMonthName}).`);
    } else if (previousMonthComparison.isLower) {
      observations.push(`You spent ${absDiff} less than last month (${previousMonthComparison.previousMonthName}).`);
    } else {
      observations.push(`Your spending matches last month (${previousMonthComparison.previousMonthName}).`);
    }
  }

  if (budget) {
    for (const alloc of budget.categoryAllocations) {
      const spent = categorySpendingMap[alloc.category] || 0;
      if (spent > alloc.limitPaise) {
        observations.push(
          `${alloc.category} is ${formatINR(spent - alloc.limitPaise)} over its allocated budget.`
        );
      } else if (alloc.limitPaise > 0 && spent / alloc.limitPaise >= 0.8) {
        observations.push(
          `${alloc.category} has ${formatINR(alloc.limitPaise - spent)} remaining in its budget (${Math.round((spent / alloc.limitPaise) * 100)}% used).`
        );
      }
    }
  }

  return {
    year: y,
    month: m,
    totalSpendingPaise: totalExpensePaise,
    totalSpendingRupees: paiseToRupees(totalExpensePaise),
    dailyAveragePaise,
    dailyAverageRupees: paiseToRupees(dailyAveragePaise),
    elapsedDays,
    daysInMonth,
    largestExpense: largestExpenseTransaction
      ? {
          id: largestExpenseTransaction._id,
          description: largestExpenseTransaction.description,
          amountPaise: largestExpenseTransaction.amountPaise,
          amountRupees: paiseToRupees(largestExpenseTransaction.amountPaise),
          category: largestExpenseTransaction.category,
          date: largestExpenseTransaction.date,
          paymentMethod: largestExpenseTransaction.paymentMethod,
        }
      : null,
    totalIncomePaise,
    totalIncomeRupees: paiseToRupees(totalIncomePaise),
    monthlySurplusRate,
    weeklySpending,
    categoryRankings,
    previousMonthComparison,
    observations,
  };
}

module.exports = {
  getMonthlySummary,
  getSixMonthTrend,
  getCategoryBreakdown,
  getDetailedBudgetStatus,
  getSpendingInsights,
};
