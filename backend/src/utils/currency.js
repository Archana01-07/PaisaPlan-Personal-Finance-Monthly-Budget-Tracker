/**
 * Currency utilities for PaisaPlan.
 * All financial storage and calculations are done in integer paise (1 INR = 100 paise)
 * to prevent floating-point rounding errors.
 */

function rupeesToPaise(rupees) {
  if (rupees === null || rupees === undefined || isNaN(rupees)) {
    return 0;
  }
  return Math.round(Number(rupees) * 100);
}

function paiseToRupees(paise) {
  if (paise === null || paise === undefined || isNaN(paise)) {
    return 0;
  }
  return Number((Number(paise) / 100).toFixed(2));
}

function formatINR(paise, includeSymbol = true) {
  const rupees = paiseToRupees(paise);
  const isNegative = rupees < 0;
  const absRupees = Math.abs(rupees);
  
  // Format to Indian numbering system (e.g. 1,00,000)
  const parts = absRupees.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian format: last 3 digits, then groups of 2 digits
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  
  // Drop .00 if whole number for clean display, or keep if decimal exists
  const formattedNumber = decimalPart === '00' 
    ? formattedInteger 
    : `${formattedInteger}.${decimalPart}`;

  const prefix = isNegative ? '-' : '';
  const symbol = includeSymbol ? '₹' : '';
  return `${prefix}${symbol}${formattedNumber}`;
}

module.exports = {
  rupeesToPaise,
  paiseToRupees,
  formatINR,
};
