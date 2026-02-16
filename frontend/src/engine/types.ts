/**
 * DC Benefits Finder — Engine Types
 *
 * All eligibility logic runs client-side (deterministic, no LLM needed).
 * These types define the data structures for user input and program output.
 */

// ── User Profile (collected from questionnaire) ──────────────────────

export interface UserProfile {
  // Section 1: About You
  age: number;
  isDCResident: boolean;
  citizenshipStatus: CitizenshipStatus;
  isPregnant: boolean | null; // null = prefer not to say
  hasDisability: boolean;
  isVeteran: boolean;

  // Section 2: Household
  householdSize: number;
  childrenUnder18: number;
  childrenAges: number[];
  adultsOver65: number;
  relationshipStatus: RelationshipStatus;
  isBreastfeeding: boolean;

  // Section 3: Employment & Income
  employmentStatus: EmploymentStatus;
  worksForDCEmployer: boolean;
  lostJobRecently: boolean;
  lostJobNoFault: boolean;
  grossMonthlyIncome: number;
  earnedMonthlyIncome: number;
  annualIncome: number;

  // Section 4: Housing & Expenses
  housingSituation: HousingSituation;
  monthlyRent: number;
  hasHomesteadDeduction: boolean | null; // null = don't know
  monthlyUtilities: number;
  paysChildCare: boolean;
  monthlyChildCare: number;
  monthlyMedicalExpenses: number;

  // Section 5: Current Benefits
  currentBenefits: string[];
}

export type CitizenshipStatus =
  | 'us_citizen'
  | 'permanent_resident'
  | 'other_immigration'
  | 'undocumented'
  | 'prefer_not_to_say';

export type RelationshipStatus =
  | 'single'
  | 'married'
  | 'separated'
  | 'widowed';

export type EmploymentStatus =
  | 'employed_full'
  | 'employed_part'
  | 'self_employed'
  | 'unemployed_looking'
  | 'unemployed_not_looking'
  | 'unable_to_work'
  | 'retired'
  | 'student';

export type HousingSituation =
  | 'own'
  | 'rent'
  | 'living_with_others'
  | 'homeless'
  | 'other';

// ── Program Eligibility Result ───────────────────────────────────────

export type EligibilityStatus =
  | 'likely_eligible'
  | 'may_be_eligible'
  | 'likely_ineligible';

export interface ProgramResult {
  programId: string;
  programName: string;
  description: string;
  status: EligibilityStatus;
  estimatedBenefit?: EstimatedBenefit;
  reasoning: string[];        // Plain-language reasons why they qualify/don't
  caveats: string[];           // e.g., "work requirements may apply"
  applyUrl: string;
  applyInstructions: string;
  sourceUrls: string[];        // Official source URLs for all thresholds used
}

export interface EstimatedBenefit {
  monthly?: number;
  annual?: number;
  weekly?: number;
  oneTime?: number;
  label: string; // e.g., "Up to $292/month in SNAP benefits"
}

// ── Program Checker Interface ────────────────────────────────────────

export type ProgramChecker = (profile: UserProfile) => ProgramResult;

// ── Benefit IDs (for currentBenefits multi-select) ───────────────────

export const BENEFIT_IDS = {
  SNAP: 'snap',
  MEDICAID: 'medicaid',
  TANF: 'tanf',
  WIC: 'wic',
  SSI_SSDI: 'ssi_ssdi',
  UNEMPLOYMENT: 'unemployment',
  PAID_FAMILY_LEAVE: 'paid_family_leave',
  CHILD_CARE_SUBSIDY: 'child_care_subsidy',
  LIHEAP: 'liheap',
  DC_EITC: 'dc_eitc',
  HOUSING_VOUCHER: 'housing_voucher',
  SCHOOL_MEALS: 'school_meals',
} as const;
