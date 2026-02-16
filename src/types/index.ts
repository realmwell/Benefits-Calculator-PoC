/** All supported benefit program identifiers */
export type BenefitProgram =
  | 'snap'
  | 'medicaid'
  | 'chip'
  | 'eitc'
  | 'section8'
  | 'liheap'
  | 'wic'
  | 'nslp';

/** Filing status for tax-related benefits */
export type FilingStatus = 'single' | 'married' | 'head_of_household';

/** Household information collected from the user */
export interface HouseholdInfo {
  /** Total number of people in the household */
  householdSize: number;
  /** Number of children under 18 */
  childrenUnder18: number;
  /** Number of children under 6 */
  childrenUnder6: number;
  /** Whether anyone in the household is pregnant */
  hasPregnant: boolean;
  /** Whether anyone is 65 or older */
  hasElderly: boolean;
  /** Whether anyone has a disability */
  hasDisabled: boolean;
  /** U.S. state (two-letter code) – for future state-specific rules */
  state: string;
}

/** Income information collected from the user */
export interface IncomeInfo {
  /** Gross monthly income (before taxes) */
  grossMonthlyIncome: number;
  /** Net monthly income (after deductions) – optional, defaults to 80% of gross */
  netMonthlyIncome?: number;
  /** Annual earned income (wages, salary, self-employment) */
  annualEarnedIncome: number;
  /** Filing status */
  filingStatus: FilingStatus;
  /** Whether the household has any investment income over $10,000 */
  hasHighInvestmentIncome: boolean;
}

/** The result of an eligibility check for a single program */
export interface EligibilityResult {
  program: BenefitProgram;
  programName: string;
  eligible: boolean;
  estimatedMonthlyBenefit: number | null;
  estimatedAnnualBenefit: number | null;
  reason: string;
  /** Income as a percentage of FPL used for this determination */
  fplPercentage: number;
}

/** Complete calculator output */
export interface CalculatorResult {
  results: EligibilityResult[];
  totalEstimatedMonthlyBenefits: number;
  totalEstimatedAnnualBenefits: number;
  householdFplPercentage: number;
}

/** Form step for the multi-step wizard */
export type FormStep = 'household' | 'income' | 'results';
