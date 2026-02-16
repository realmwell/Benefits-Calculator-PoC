/**
 * Format a number as US currency.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a percentage with one decimal place.
 */
export function formatPercent(pct: number): string {
  return `${pct.toFixed(1)}%`;
}
