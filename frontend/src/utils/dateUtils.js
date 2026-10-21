import { MONTH_NAMES } from './constants';

export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatReadableDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const m = parseInt(month, 10);
  const monthName = MONTH_NAMES[m - 1] ? MONTH_NAMES[m - 1].substring(0, 3) : '';
  return `${parseInt(day, 10)} ${monthName} ${year}`;
}

export function formatMonthName(monthNumber) {
  const m = parseInt(monthNumber, 10);
  return MONTH_NAMES[m - 1] || '';
}

export function getPreviousMonth(year, month) {
  let m = parseInt(month, 10) - 1;
  let y = parseInt(year, 10);
  if (m < 1) {
    m = 12;
    y -= 1;
  }
  return { year: y, month: m };
}

export function getNextMonth(year, month) {
  let m = parseInt(month, 10) + 1;
  let y = parseInt(year, 10);
  if (m > 12) {
    m = 1;
    y += 1;
  }
  return { year: y, month: m };
}
