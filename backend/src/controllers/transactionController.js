const Transaction = require('../models/Transaction');
const { rupeesToPaise, paiseToRupees, formatINR } = require('../utils/currency');
const { getMonthBounds } = require('../utils/dates');

function formatTransaction(t) {
  return {
    id: t._id,
    userId: t.userId,
    type: t.type,
    amountPaise: t.amountPaise,
    amountRupees: paiseToRupees(t.amountPaise),
    formattedAmount: formatINR(t.amountPaise),
    category: t.category,
    date: t.date,
    description: t.description,
    paymentMethod: t.paymentMethod,
    notes: t.notes || '',
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

async function getTransactions(req, res, next) {
  try {
    const {
      search,
      month,
      year,
      category,
      type,
      sort = 'date-desc',
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build query scoped strictly to authenticated user
    const query = { userId: req.user._id };

    if (month && year) {
      const bounds = getMonthBounds(parseInt(year, 10), parseInt(month, 10));
      query.date = { $gte: bounds.startDate, $lte: bounds.endDate };
    }

    if (type && (type === 'income' || type === 'expense')) {
      query.type = type;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search && search.trim() !== '') {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { description: { $regex: escaped, $options: 'i' } },
        { notes: { $regex: escaped, $options: 'i' } },
      ];
    }

    // Sort order
    let sortOptions = { date: -1, createdAt: -1 };
    if (sort === 'date-asc') {
      sortOptions = { date: 1, createdAt: 1 };
    } else if (sort === 'amount-desc') {
      sortOptions = { amountPaise: -1, date: -1 };
    } else if (sort === 'amount-asc') {
      sortOptions = { amountPaise: 1, date: -1 };
    }

    // Compute month summary independently for header statistics
    let summaryQuery = { userId: req.user._id };
    if (month && year) {
      const bounds = getMonthBounds(parseInt(year, 10), parseInt(month, 10));
      summaryQuery.date = { $gte: bounds.startDate, $lte: bounds.endDate };
    }

    const [transactions, totalCount, summaryAgg] = await Promise.all([
      Transaction.find(query).sort(sortOptions).skip(skip).limit(limitNum),
      Transaction.countDocuments(query),
      Transaction.aggregate([
        { $match: summaryQuery },
        {
          $group: {
            _id: '$type',
            totalPaise: { $sum: '$amountPaise' },
          },
        },
      ]),
    ]);

    let incomePaise = 0;
    let expensePaise = 0;
    for (const item of summaryAgg) {
      if (item._id === 'income') incomePaise = item.totalPaise;
      if (item._id === 'expense') expensePaise = item.totalPaise;
    }
    const netPaise = incomePaise - expensePaise;

    res.status(200).json({
      success: true,
      transactions: transactions.map(formatTransaction),
      totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
      limit: limitNum,
      summary: {
        incomePaise,
        incomeRupees: paiseToRupees(incomePaise),
        expensePaise,
        expenseRupees: paiseToRupees(expensePaise),
        netPaise,
        netRupees: paiseToRupees(netPaise),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getTransactionById(req, res, next) {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findOne({ _id: id, userId: req.user._id });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      transaction: formatTransaction(transaction),
    });
  } catch (err) {
    next(err);
  }
}

async function createTransaction(req, res, next) {
  try {
    const { type, amount, category, date, description, paymentMethod, notes } = req.validatedBody;
    const amountPaise = rupeesToPaise(amount);

    const transaction = await Transaction.create({
      userId: req.user._id,
      type,
      amountPaise,
      category,
      date,
      description,
      paymentMethod,
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      transaction: formatTransaction(transaction),
    });
  } catch (err) {
    next(err);
  }
}

async function updateTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const { type, amount, category, date, description, paymentMethod, notes } = req.validatedBody;
    const amountPaise = rupeesToPaise(amount);

    const transaction = await Transaction.findOne({ _id: id, userId: req.user._id });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or access denied',
      });
    }

    transaction.type = type;
    transaction.amountPaise = amountPaise;
    transaction.category = category;
    transaction.date = date;
    transaction.description = description;
    transaction.paymentMethod = paymentMethod;
    transaction.notes = notes || '';

    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      transaction: formatTransaction(transaction),
    });
  } catch (err) {
    next(err);
  }
}

async function deleteTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const result = await Transaction.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or access denied',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
