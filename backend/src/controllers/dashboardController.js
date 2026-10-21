const {
  getMonthlySummary,
  getSixMonthTrend,
  getCategoryBreakdown,
} = require('../services/calculationService');
const { getCurrentCalendarDate } = require('../utils/dates');

async function getDashboard(req, res, next) {
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

    const [summary, sixMonthTrend, categoryBreakdown] = await Promise.all([
      getMonthlySummary(req.user._id, y, m),
      getSixMonthTrend(req.user._id, y, m),
      getCategoryBreakdown(req.user._id, y, m),
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary,
        sixMonthTrend,
        categoryBreakdown,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
};
