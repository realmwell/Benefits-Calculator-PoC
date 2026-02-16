/**
 * SNAP (Supplemental Nutrition Assistance Program) — DC-specific thresholds
 *
 * Sources:
 * - Max allotments: https://www.fns.usda.gov/snap/allotment (FY2025, Oct 2024–Sep 2025)
 * - Deductions: https://www.fns.usda.gov/snap/eligibility
 * - DC-specific rules: https://www.snapscreener.com/guides/district-of-columbia
 */

/**
 * Maximum monthly SNAP allotments by household size (FY2025).
 * Source: https://www.fns.usda.gov/snap/allotment
 */
export const SNAP_MAX_ALLOTMENT: Record<number, number> = {
  1: 292,
  2: 536,
  3: 768,
  4: 975,
  5: 1158,
  6: 1390,
  7: 1536,
  8: 1756,
};

// Each additional person above 8: +$220
// Source: https://www.fns.usda.gov/snap/allotment
export const SNAP_ADDITIONAL_PERSON = 220;

/**
 * Get max SNAP allotment for a household size.
 */
export function getMaxAllotment(householdSize: number): number {
  if (householdSize <= 0) return 0;
  if (householdSize <= 8) return SNAP_MAX_ALLOTMENT[householdSize];
  return SNAP_MAX_ALLOTMENT[8] + (householdSize - 8) * SNAP_ADDITIONAL_PERSON;
}

/**
 * Standard deduction by household size.
 * Source: https://www.fns.usda.gov/snap/eligibility
 */
export function getStandardDeduction(householdSize: number): number {
  // Source: https://fns-prod.azureedge.us/sites/default/files/media/file/FY2025-Maximum-Allotments-Deductions.pdf
  if (householdSize <= 3) return 204;
  if (householdSize === 4) return 217;
  if (householdSize === 5) return 254;
  return 291; // 6+ persons
}

/**
 * Earned income deduction: 20% of earned income.
 * Source: https://www.fns.usda.gov/snap/eligibility
 */
export const EARNED_INCOME_DEDUCTION_RATE = 0.20;

/**
 * Excess shelter deduction cap (non-elderly/non-disabled households).
 * Source: https://www.snapscreener.com/guides/district-of-columbia
 */
export const SHELTER_DEDUCTION_CAP = 712;

/**
 * Medical expense threshold for elderly/disabled.
 * Only expenses above $35/month are deductible.
 * Source: https://www.fns.usda.gov/snap/eligibility
 */
export const MEDICAL_EXPENSE_THRESHOLD = 35;

/**
 * DC minimum SNAP benefit (state-funded).
 * Source: https://www.snapscreener.com/guides/district-of-columbia
 */
export const DC_MINIMUM_BENEFIT = 30;

/**
 * SNAP benefit = max allotment - 30% of net income.
 * The 30% factor represents the household's expected contribution to food costs.
 * Source: https://www.fns.usda.gov/snap/eligibility
 */
export const NET_INCOME_CONTRIBUTION_RATE = 0.30;
