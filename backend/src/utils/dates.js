const { MONTH_NAMES } = require('../config/constants');

/**
 * Validates that a string is a strict YYYY-MM-DD calendar date
 */
function isValidCalendarDate(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (year < 1900 || year > 2100) return false;

  const daysInMonth = getDaysInMonth(year, month);
  return day >= 1 && day <= daysInMonth;
}

/**
 * Returns the number of days in a given year and month (1-12)
 */
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * Returns formatted start and end dates for a month in YYYY-MM-DD
 */
function getMonthBounds(year, month) {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const monthStr = String(m).padStart(2, '0');
  const days = getDaysInMonth(y, m);
  const endDayStr = String(days).padStart(2, '0');

  return {
    startDate: `${y}-${monthStr}-01`,
    endDate: `${y}-${monthStr}-${endDayStr}`,
    daysInMonth: days,
  };
}

/**
 * Returns current calendar date in YYYY-MM-DD
 */
function getCurrentCalendarDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates elapsed calendar days for a given month and year.
 * If current calendar month: elapsed days up to today.
 * If past completed month: total days in that month.
 * If future month: 0.
 */
function getElapsedDays(year, month, todayStr = getCurrentCalendarDate()) {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const [todayY, todayM, todayD] = todayStr.split('-').map(Number);

  if (y < todayY || (y === todayY && m < todayM)) {
    // Past completed month
    return getDaysInMonth(y, m);
  }
  if (y === todayY && m === todayM) {
    // Current month: elapsed days up to today
    return Math.max(1, Math.min(todayD, getDaysInMonth(y, m)));
  }
  // Future month
  return 0;
}

/**
 * Returns readable month name and year (e.g., "September 2026")
 */
function formatMonthYear(year, month) {
  const m = parseInt(month, 10);
  const name = MONTH_NAMES[m - 1] || '';
  return `${name} ${year}`;
}

module.exports = {
  isValidCalendarDate,
  getDaysInMonth,
  getMonthBounds,
  getCurrentCalendarDate,
  getElapsedDays,
  formatMonthYear,
  MONTH_NAMES,
};
