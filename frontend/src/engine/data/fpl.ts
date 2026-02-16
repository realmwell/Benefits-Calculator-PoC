/**
 * 2025 Federal Poverty Level (FPL) Guidelines — 48 contiguous states + DC
 *
 * Source: https://aspe.hhs.gov/poverty-guidelines
 * Published: January 2025
 *
 * IMPORTANT: Update annually when new guidelines are published (usually January).
 */

// Base amount for household size 1, and increment per additional person
// Source: https://aspe.hhs.gov/poverty-guidelines
const FPL_BASE = 15650;   // HH size 1
const FPL_INCREMENT = 5500; // Each additional person

/**
 * Returns 100% FPL for a given household size.
 */
export function getFPL(householdSize: number): number {
  if (householdSize < 1) return FPL_BASE;
  return FPL_BASE + FPL_INCREMENT * (householdSize - 1);
}

/**
 * Returns FPL at a given percentage for a household size.
 * e.g., getFPLAtPercent(2, 200) returns 200% FPL for a 2-person household.
 */
export function getFPLAtPercent(householdSize: number, percent: number): number {
  return Math.round(getFPL(householdSize) * (percent / 100));
}

/**
 * Returns monthly FPL at a given percentage for a household size.
 */
export function getMonthlyFPLAtPercent(householdSize: number, percent: number): number {
  return Math.round(getFPLAtPercent(householdSize, percent) / 12);
}

/**
 * Pre-computed FPL reference table for common percentages.
 * Source: https://aspe.hhs.gov/poverty-guidelines
 *
 * HH Size | 100%    | 130%    | 185%    | 200%    | 215%    | 319%
 * 1       | $15,650 | $20,345 | $28,953 | $31,300 | $33,648 | $49,924
 * 2       | $21,150 | $27,495 | $39,128 | $42,300 | $45,473 | $67,469
 * 3       | $26,650 | $34,645 | $49,303 | $53,300 | $57,298 | $85,014
 * 4       | $32,150 | $41,795 | $59,478 | $64,300 | $69,123 | $102,559
 * +each   | +$5,500 | +$7,150 | +$10,175| +$11,000| +$11,825| +$17,545
 */

/**
 * DC State Median Income (SMI) thresholds for LIHEAP.
 * 60% SMI by household size (FY2025 estimates).
 * Source: https://liheapch.acf.gov/profiles/DC.htm
 *
 * These are approximate; actual values are set by HHS annually.
 */
export const SMI_60_PERCENT: Record<number, number> = {
  // Source: https://liheapch.acf.gov/profiles/DC.htm
  1: 42180,
  2: 55140,
  3: 68100,
  4: 81060,
  5: 94020,
  6: 106980,
  7: 109404,
  8: 111828,
};

/**
 * Get 60% SMI for a household size. For sizes > 8, extrapolate.
 */
export function getSMI60(householdSize: number): number {
  if (householdSize <= 0) return SMI_60_PERCENT[1];
  if (householdSize <= 8) return SMI_60_PERCENT[householdSize];
  // Extrapolate for larger households
  return SMI_60_PERCENT[8] + (householdSize - 8) * 2424;
}
