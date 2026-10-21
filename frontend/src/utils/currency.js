/**
 * Currency utilities for PaisaPlan frontend
 */

export function rupeesToPaise(rupees) {
  if (rupees === null || rupees === undefined || isNaN(rupees)) {
    return 0;
  }
  return Math.round(Number(rupees) * 100);
}

export function paiseToRupees(paise) {
  if (paise === null || paise === undefined || isNaN(paise)) {
    return 0;
  }
  return Number((Number(paise) / 100).toFixed(2));
}

export function formatINR(amount, isPaise = false) {
  const numericAmount = isPaise ? paiseToRupees(amount) : Number(amount || 0);
  const isNegative = numericAmount < 0;
  const absAmount = Math.abs(numericAmount);

  const parts = absAmount.toFixed(2).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const display = decimalPart === '00' 
    ? formattedInteger 
    : `${formattedInteger}.${decimalPart}`;

  return `${isNegative ? '-' : ''}₹${display}`;
}
