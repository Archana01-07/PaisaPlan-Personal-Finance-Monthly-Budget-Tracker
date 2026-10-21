// Vitest globals enabled
const { rupeesToPaise, paiseToRupees, formatINR } = require('../src/utils/currency');
const {
  isValidCalendarDate,
  getDaysInMonth,
  getMonthBounds,
  getElapsedDays,
} = require('../src/utils/dates');

describe('Financial & Currency Utilities', () => {
  it('correctly converts rupees to integer paise without floating point issues', () => {
    expect(rupeesToPaise(100)).toBe(10000);
    expect(rupeesToPaise(8500.5)).toBe(850050);
    expect(rupeesToPaise('4280.25')).toBe(428025);
    expect(rupeesToPaise(0.1 + 0.2)).toBe(30); // Classic JS 0.30000000000000004
  });

  it('correctly converts paise to rupees', () => {
    expect(paiseToRupees(10000)).toBe(100);
    expect(paiseToRupees(850050)).toBe(8500.5);
    expect(paiseToRupees(428025)).toBe(4280.25);
  });

  it('formats Indian numbering system accurately', () => {
    expect(formatINR(1346000)).toBe('₹13,460');
    expect(formatINR(10000000)).toBe('₹1,00,000');
    expect(formatINR(28000)).toBe('₹280');
    expect(formatINR(-50000)).toBe('-₹500');
    expect(formatINR(428050)).toBe('₹4,280.50');
  });
});

describe('Date & Calendar Utilities', () => {
  it('validates YYYY-MM-DD calendar date strings', () => {
    expect(isValidCalendarDate('2026-09-15')).toBe(true);
    expect(isValidCalendarDate('2026-02-28')).toBe(true);
    expect(isValidCalendarDate('2026-02-29')).toBe(false); // 2026 is not a leap year
    expect(isValidCalendarDate('2024-02-29')).toBe(true); // 2024 is a leap year
    expect(isValidCalendarDate('invalid-date')).toBe(false);
    expect(isValidCalendarDate('2026-13-01')).toBe(false);
  });

  it('computes exact month boundaries', () => {
    const sept2026 = getMonthBounds(2026, 9);
    expect(sept2026.startDate).toBe('2026-09-01');
    expect(sept2026.endDate).toBe('2026-09-30');
    expect(sept2026.daysInMonth).toBe(30);

    const feb2024 = getMonthBounds(2024, 2);
    expect(feb2024.daysInMonth).toBe(29);
  });

  it('calculates elapsed calendar days correctly', () => {
    // Past completed month: should equal all days in that month
    expect(getElapsedDays(2026, 8, '2026-10-15')).toBe(31);

    // Current month: elapsed days up to reference date
    expect(getElapsedDays(2026, 9, '2026-09-20')).toBe(20);

    // Future month: 0 days
    expect(getElapsedDays(2026, 12, '2026-09-15')).toBe(0);
  });
});
