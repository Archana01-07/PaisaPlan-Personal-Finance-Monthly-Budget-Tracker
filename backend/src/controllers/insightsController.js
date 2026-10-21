const { getSpendingInsights } = require('../services/calculationService');
const { getCurrentCalendarDate } = require('../utils/dates');

async function getInsights(req, res, next) {
  try {
    let { month, year } = req.query;

    if (!month || !year) {
      const today = getCurrentCalendarDate();
      const parts = today.split('-');
      year = parts[0];
      month = parts[1];
    }

    const y = parseInt(year, 10);
    const m = parseInt(month, 10);

    const insights = await getSpendingInsights(req.user._id, y, m);

    res.status(200).json({
      success: true,
      data: insights,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getInsights,
};
