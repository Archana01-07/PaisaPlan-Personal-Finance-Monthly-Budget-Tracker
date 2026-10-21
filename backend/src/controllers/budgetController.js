const Budget = require('../models/Budget');
const { rupeesToPaise } = require('../utils/currency');
const { getDetailedBudgetStatus } = require('../services/calculationService');

async function getBudget(req, res, next) {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year query parameters are required',
      });
    }

    const y = parseInt(year, 10);
    const m = parseInt(month, 10);

    const budgetStatus = await getDetailedBudgetStatus(req.user._id, y, m);

    res.status(200).json({
      success: true,
      data: budgetStatus,
    });
  } catch (err) {
    next(err);
  }
}

async function upsertBudget(req, res, next) {
  try {
    const { year, month } = req.params;
    const { totalLimit, categoryAllocations = [] } = req.validatedBody;

    const y = parseInt(year, 10);
    const m = parseInt(month, 10);

    if (m < 1 || m > 12) {
      return res.status(400).json({
        success: false,
        message: 'Month must be between 1 and 12',
      });
    }

    if (y < 2000 || y > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Year must be between 2000 and 2100',
      });
    }

    const totalLimitPaise = rupeesToPaise(totalLimit);
    const mappedAllocations = categoryAllocations.map((a) => ({
      category: a.category,
      limitPaise: rupeesToPaise(a.limit),
    }));

    // Find and update or create
    let budget = await Budget.findOne({ userId: req.user._id, year: y, month: m });
    if (budget) {
      budget.totalLimitPaise = totalLimitPaise;
      budget.categoryAllocations = mappedAllocations;
      await budget.save();
    } else {
      budget = await Budget.create({
        userId: req.user._id,
        year: y,
        month: m,
        totalLimitPaise,
        categoryAllocations: mappedAllocations,
      });
    }

    const updatedStatus = await getDetailedBudgetStatus(req.user._id, y, m);

    res.status(200).json({
      success: true,
      message: 'Monthly budget saved successfully',
      data: updatedStatus,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBudget,
  upsertBudget,
};
