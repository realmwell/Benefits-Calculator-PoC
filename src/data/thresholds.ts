/**
 * 2024 Federal Poverty Level (FPL) guidelines for the 48 contiguous states and DC.
 * Source: HHS Poverty Guidelines (simplified for PoC).
 * Key = household size, Value = annual income at 100% FPL.
 */
export const FPL_2024: Record<number, number> = {
  1: 15060,
  2: 20440,
  3: 25820,
  4: 31200,
  5: 36580,
  6: 41960,
  7: 47340,
  8: 52720,
};

/** For each additional person above 8, add this amount */
export const FPL_ADDITIONAL_PERSON = 5380;

/**
 * Get the FPL annual income for a given household size.
 */
export function getFPL(householdSize: number): number {
  if (householdSize <= 0) return FPL_2024[1];
  if (householdSize <= 8) return FPL_2024[householdSize];
  return FPL_2024[8] + (householdSize - 8) * FPL_ADDITIONAL_PERSON;
}

/**
 * Calculate household income as a percentage of FPL.
 */
export function getFPLPercentage(annualIncome: number, householdSize: number): number {
  const fpl = getFPL(householdSize);
  return (annualIncome / fpl) * 100;
}

/** SNAP gross income limit as % of FPL */
export const SNAP_GROSS_INCOME_LIMIT_PCT = 130;
/** SNAP net income limit as % of FPL */
export const SNAP_NET_INCOME_LIMIT_PCT = 100;

/** Maximum monthly SNAP allotment by household size (FY2024, 48 states) */
export const SNAP_MAX_ALLOTMENT: Record<number, number> = {
  1: 291,
  2: 535,
  3: 766,
  4: 973,
  5: 1155,
  6: 1386,
  7: 1532,
  8: 1751,
};
/** Each additional person above 8 */
export const SNAP_ADDITIONAL_PERSON = 219;

/** Medicaid expansion income limit (138% FPL in expansion states) */
export const MEDICAID_EXPANSION_LIMIT_PCT = 138;

/** CHIP upper income limit (typically 200-300% FPL, using 200% for PoC) */
export const CHIP_INCOME_LIMIT_PCT = 200;

/** Section 8 income limit (50% of area median income, approximated as 50% FPL for PoC) */
export const SECTION8_INCOME_LIMIT_PCT = 50;

/** LIHEAP income limit (150% FPL or 60% state median, using 150% FPL for PoC) */
export const LIHEAP_INCOME_LIMIT_PCT = 150;

/** WIC income limit (185% FPL) */
export const WIC_INCOME_LIMIT_PCT = 185;

/** NSLP free lunch income limit (130% FPL) */
export const NSLP_FREE_LIMIT_PCT = 130;
/** NSLP reduced lunch income limit (185% FPL) */
export const NSLP_REDUCED_LIMIT_PCT = 185;

/**
 * EITC income limits and credit amounts for tax year 2024.
 * Indexed by number of qualifying children.
 */
export const EITC_2024: Record<number, {
  singleLimit: number;
  marriedLimit: number;
  maxCredit: number;
}> = {
  0: { singleLimit: 18591, marriedLimit: 25511, maxCredit: 632 },
  1: { singleLimit: 49084, marriedLimit: 56004, maxCredit: 3995 },
  2: { singleLimit: 55768, marriedLimit: 62688, maxCredit: 6604 },
  3: { singleLimit: 59899, marriedLimit: 66819, maxCredit: 7430 },
};
