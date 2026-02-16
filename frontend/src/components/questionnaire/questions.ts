/**
 * Questionnaire question definitions with conditional logic.
 *
 * Each question has:
 * - id: maps to a key in UserProfile
 * - section: which section it belongs to
 * - type: input type for rendering
 * - label: the question text
 * - helpText: optional clarification
 * - options: for select/radio types
 * - condition: function that determines if this question should be shown
 */

import type { UserProfile } from '../../engine/types';

export type QuestionType =
  | 'number'
  | 'currency'
  | 'yes_no'
  | 'yes_no_prefer_not'
  | 'select'
  | 'multi_select'
  | 'number_list';

export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: keyof UserProfile;
  section: string;
  sectionNumber: number;
  type: QuestionType;
  label: string;
  helpText?: string;
  options?: QuestionOption[];
  condition?: (answers: Partial<UserProfile>) => boolean;
  placeholder?: string;
  min?: number;
  max?: number;
}

export const SECTIONS = [
  { number: 1, title: 'About You' },
  { number: 2, title: 'Your Household' },
  { number: 3, title: 'Employment & Income' },
  { number: 4, title: 'Housing & Expenses' },
  { number: 5, title: 'Current Benefits' },
];

export const QUESTIONS: Question[] = [
  // ── Section 1: About You ──────────────────────────────────────
  {
    id: 'age',
    section: 'About You',
    sectionNumber: 1,
    type: 'number',
    label: 'How old are you?',
    placeholder: 'Enter your age',
    min: 0,
    max: 120,
  },
  {
    id: 'isDCResident',
    section: 'About You',
    sectionNumber: 1,
    type: 'yes_no',
    label: 'Do you live in Washington, DC?',
    helpText: 'This tool is specifically for DC residents.',
  },
  {
    id: 'citizenshipStatus',
    section: 'About You',
    sectionNumber: 1,
    type: 'select',
    label: 'What is your citizenship or immigration status?',
    helpText: 'This affects which programs you may qualify for. Your answer is not stored or shared.',
    options: [
      { value: 'us_citizen', label: 'U.S. citizen' },
      { value: 'permanent_resident', label: 'Permanent resident (green card)' },
      { value: 'other_immigration', label: 'Other immigration status (visa, TPS, asylum, etc.)' },
      { value: 'undocumented', label: 'Undocumented' },
      { value: 'prefer_not_to_say', label: 'Prefer not to say' },
    ],
  },
  {
    id: 'isPregnant',
    section: 'About You',
    sectionNumber: 1,
    type: 'yes_no_prefer_not',
    label: 'Are you currently pregnant?',
    helpText: 'Pregnancy affects eligibility for several programs including WIC and Medicaid.',
  },
  {
    id: 'hasDisability',
    section: 'About You',
    sectionNumber: 1,
    type: 'yes_no',
    label: 'Do you have a disability that limits your ability to work?',
  },
  {
    id: 'isVeteran',
    section: 'About You',
    sectionNumber: 1,
    type: 'yes_no',
    label: 'Are you a veteran?',
  },

  // ── Section 2: Your Household ─────────────────────────────────
  {
    id: 'householdSize',
    section: 'Your Household',
    sectionNumber: 2,
    type: 'number',
    label: 'How many people live in your household, including you?',
    placeholder: 'Enter number of people',
    min: 1,
    max: 20,
  },
  {
    id: 'childrenUnder18',
    section: 'Your Household',
    sectionNumber: 2,
    type: 'number',
    label: 'How many are children under 18?',
    placeholder: '0',
    min: 0,
    max: 15,
  },
  {
    id: 'childrenAges',
    section: 'Your Household',
    sectionNumber: 2,
    type: 'number_list',
    label: 'What are the ages of your children?',
    helpText: 'Enter each child\'s age. This helps determine eligibility for programs like WIC (under 5), child care (under 13), and school meals.',
    condition: (a) => (a.childrenUnder18 ?? 0) > 0,
  },
  {
    id: 'adultsOver65',
    section: 'Your Household',
    sectionNumber: 2,
    type: 'number',
    label: 'How many household members are 65 or older?',
    placeholder: '0',
    min: 0,
    max: 10,
  },
  {
    id: 'relationshipStatus',
    section: 'Your Household',
    sectionNumber: 2,
    type: 'select',
    label: 'What is your relationship status?',
    options: [
      { value: 'single', label: 'Single' },
      { value: 'married', label: 'Married or domestic partnership' },
      { value: 'separated', label: 'Separated' },
      { value: 'widowed', label: 'Widowed' },
    ],
  },
  {
    id: 'isBreastfeeding',
    section: 'Your Household',
    sectionNumber: 2,
    type: 'yes_no',
    label: 'Are you currently breastfeeding?',
    condition: (a) =>
      a.isPregnant === false || a.isPregnant === null,
  },

  // ── Section 3: Employment & Income ────────────────────────────
  {
    id: 'employmentStatus',
    section: 'Employment & Income',
    sectionNumber: 3,
    type: 'select',
    label: 'What is your current employment status?',
    options: [
      { value: 'employed_full', label: 'Employed full-time' },
      { value: 'employed_part', label: 'Employed part-time' },
      { value: 'self_employed', label: 'Self-employed' },
      { value: 'unemployed_looking', label: 'Unemployed, looking for work' },
      { value: 'unemployed_not_looking', label: 'Unemployed, not looking for work' },
      { value: 'unable_to_work', label: 'Unable to work' },
      { value: 'retired', label: 'Retired' },
      { value: 'student', label: 'Student' },
    ],
  },
  {
    id: 'worksForDCEmployer',
    section: 'Employment & Income',
    sectionNumber: 3,
    type: 'yes_no',
    label: 'Do you work for a DC-based employer?',
    helpText: 'This determines eligibility for DC Paid Family Leave.',
    condition: (a) =>
      ['employed_full', 'employed_part', 'self_employed'].includes(a.employmentStatus ?? ''),
  },
  {
    id: 'lostJobRecently',
    section: 'Employment & Income',
    sectionNumber: 3,
    type: 'yes_no',
    label: 'Did you lose your job in the last 12 months?',
    condition: (a) =>
      ['unemployed_looking', 'unemployed_not_looking'].includes(a.employmentStatus ?? ''),
  },
  {
    id: 'lostJobNoFault',
    section: 'Employment & Income',
    sectionNumber: 3,
    type: 'yes_no',
    label: 'Was it through no fault of your own (layoff, reduction in force, etc.)?',
    condition: (a) =>
      ['unemployed_looking', 'unemployed_not_looking'].includes(a.employmentStatus ?? '') &&
      a.lostJobRecently === true,
  },
  {
    id: 'grossMonthlyIncome',
    section: 'Employment & Income',
    sectionNumber: 3,
    type: 'currency',
    label: 'What is your total household gross monthly income?',
    helpText: 'Include all sources: wages, Social Security, child support, pension, unemployment benefits, etc. Enter the total before taxes.',
    placeholder: '0',
    min: 0,
  },
  {
    id: 'earnedMonthlyIncome',
    section: 'Employment & Income',
    sectionNumber: 3,
    type: 'currency',
    label: 'How much of that is earned income from work?',
    helpText: 'Wages, salary, and self-employment income only. Do not include Social Security, child support, or other non-work income.',
    placeholder: '0',
    min: 0,
  },
  {
    id: 'annualIncome',
    section: 'Employment & Income',
    sectionNumber: 3,
    type: 'currency',
    label: 'What is your approximate total annual household income?',
    helpText: 'If unsure, we can estimate from your monthly income.',
    placeholder: '0',
    min: 0,
  },

  // ── Section 4: Housing & Expenses ─────────────────────────────
  {
    id: 'housingSituation',
    section: 'Housing & Expenses',
    sectionNumber: 4,
    type: 'select',
    label: 'What is your housing situation?',
    options: [
      { value: 'rent', label: 'I rent' },
      { value: 'own', label: 'I own my home' },
      { value: 'living_with_others', label: 'Living with others (no rent)' },
      { value: 'homeless', label: 'Homeless or in a shelter' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'monthlyRent',
    section: 'Housing & Expenses',
    sectionNumber: 4,
    type: 'currency',
    label: 'How much is your monthly rent?',
    placeholder: '0',
    min: 0,
    condition: (a) => a.housingSituation === 'rent',
  },
  {
    id: 'hasHomesteadDeduction',
    section: 'Housing & Expenses',
    sectionNumber: 4,
    type: 'yes_no_prefer_not',
    label: 'Do you have a homestead deduction filed for your property?',
    helpText: "The homestead deduction reduces your property's assessed value. If you're not sure, select \"I don't know.\"",
    condition: (a) => a.housingSituation === 'own',
  },
  {
    id: 'monthlyUtilities',
    section: 'Housing & Expenses',
    sectionNumber: 4,
    type: 'currency',
    label: 'What are your monthly utility costs?',
    helpText: 'Electric, gas, water. Enter 0 if utilities are included in your rent.',
    placeholder: '0',
    min: 0,
  },
  {
    id: 'paysChildCare',
    section: 'Housing & Expenses',
    sectionNumber: 4,
    type: 'yes_no',
    label: 'Do you pay for child care?',
    condition: (a) => (a.childrenUnder18 ?? 0) > 0,
  },
  {
    id: 'monthlyChildCare',
    section: 'Housing & Expenses',
    sectionNumber: 4,
    type: 'currency',
    label: 'How much do you spend on child care per month?',
    placeholder: '0',
    min: 0,
    condition: (a) => a.paysChildCare === true,
  },
  {
    id: 'monthlyMedicalExpenses',
    section: 'Housing & Expenses',
    sectionNumber: 4,
    type: 'currency',
    label: 'What are your monthly out-of-pocket medical expenses?',
    helpText: 'This is used for SNAP deductions. Only applies if you or a household member is 65+ or disabled.',
    placeholder: '0',
    min: 0,
    condition: (a) =>
      (a.adultsOver65 ?? 0) > 0 || a.hasDisability === true,
  },

  // ── Section 5: Current Benefits ───────────────────────────────
  {
    id: 'currentBenefits',
    section: 'Current Benefits',
    sectionNumber: 5,
    type: 'multi_select',
    label: 'Which of these benefits do you currently receive?',
    helpText: 'Select all that apply. This helps us avoid recommending programs you already have.',
    options: [
      { value: 'snap', label: 'SNAP (food stamps)' },
      { value: 'medicaid', label: 'Medicaid' },
      { value: 'tanf', label: 'TANF (cash assistance)' },
      { value: 'wic', label: 'WIC' },
      { value: 'ssi_ssdi', label: 'SSI or SSDI' },
      { value: 'unemployment', label: 'Unemployment insurance' },
      { value: 'paid_family_leave', label: 'DC Paid Family Leave' },
      { value: 'child_care_subsidy', label: 'Child care subsidy' },
      { value: 'liheap', label: 'LIHEAP (energy assistance)' },
      { value: 'dc_eitc', label: 'DC EITC (last tax year)' },
      { value: 'housing_voucher', label: 'Housing voucher' },
      { value: 'school_meals', label: 'Free/reduced school meals' },
      { value: 'none', label: 'None of these' },
    ],
  },
];

/**
 * Get the list of visible questions based on current answers.
 */
export function getVisibleQuestions(answers: Partial<UserProfile>): Question[] {
  return QUESTIONS.filter(q => !q.condition || q.condition(answers));
}
