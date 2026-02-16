/**
 * SNAP (Supplemental Nutrition Assistance Program) — DC Eligibility Checker
 *
 * Sources:
 * - DC DHS: https://dhs.dc.gov/service/snap
 * - USDA allotments: https://www.fns.usda.gov/snap/allotment
 * - USDA eligibility: https://www.fns.usda.gov/snap/eligibility
 * - DC-specific (BBCE, no asset test): https://www.snapscreener.com/guides/district-of-columbia
 */

import type { UserProfile, ProgramResult } from '../types';
import { getFPLAtPercent } from '../data/fpl';
import {
  getMaxAllotment,
  getStandardDeduction,
  EARNED_INCOME_DEDUCTION_RATE,
  SHELTER_DEDUCTION_CAP,
  MEDICAL_EXPENSE_THRESHOLD,
  DC_MINIMUM_BENEFIT,
  NET_INCOME_CONTRIBUTION_RATE,
} from '../data/snap';

const SOURCE_URLS = [
  'https://dhs.dc.gov/service/snap',
  'https://www.fns.usda.gov/snap/allotment',
  'https://www.fns.usda.gov/snap/eligibility',
  'https://www.snapscreener.com/guides/district-of-columbia',
];

/**
 * Calculate SNAP net income after deductions.
 */
function calculateNetIncome(profile: UserProfile): {
  netIncome: number;
  deductions: string[];
} {
  const deductions: string[] = [];
  let totalDeductions = 0;

  // 1. Standard deduction
  // Source: https://www.fns.usda.gov/snap/eligibility
  const stdDeduction = getStandardDeduction(profile.householdSize);
  totalDeductions += stdDeduction;
  deductions.push(`Standard deduction: $${stdDeduction}`);

  // 2. 20% earned income deduction
  // Source: https://www.fns.usda.gov/snap/eligibility
  const earnedDeduction = Math.round(profile.earnedMonthlyIncome * EARNED_INCOME_DEDUCTION_RATE);
  if (earnedDeduction > 0) {
    totalDeductions += earnedDeduction;
    deductions.push(`Earned income deduction (20%): $${earnedDeduction}`);
  }

  // 3. Dependent care deduction
  if (profile.paysChildCare && profile.monthlyChildCare > 0) {
    totalDeductions += profile.monthlyChildCare;
    deductions.push(`Dependent care deduction: $${profile.monthlyChildCare}`);
  }

  // 4. Medical expense deduction (elderly/disabled only, amounts over $35)
  // Source: https://www.fns.usda.gov/snap/eligibility
  const hasElderlyOrDisabled = profile.adultsOver65 > 0 || profile.hasDisability;
  if (hasElderlyOrDisabled && profile.monthlyMedicalExpenses > MEDICAL_EXPENSE_THRESHOLD) {
    const medDeduction = profile.monthlyMedicalExpenses - MEDICAL_EXPENSE_THRESHOLD;
    totalDeductions += medDeduction;
    deductions.push(`Medical expense deduction: $${medDeduction}`);
  }

  // 5. Excess shelter deduction
  const incomeAfterOtherDeductions = profile.grossMonthlyIncome - totalDeductions;
  const halfIncome = Math.round(incomeAfterOtherDeductions / 2);
  const shelterCosts = profile.monthlyRent + profile.monthlyUtilities;

  if (shelterCosts > halfIncome) {
    let shelterDeduction = shelterCosts - halfIncome;

    // Cap at $712 unless elderly/disabled
    // Source: https://www.snapscreener.com/guides/district-of-columbia
    if (!hasElderlyOrDisabled && shelterDeduction > SHELTER_DEDUCTION_CAP) {
      shelterDeduction = SHELTER_DEDUCTION_CAP;
    }

    totalDeductions += shelterDeduction;
    deductions.push(`Excess shelter deduction: $${shelterDeduction}`);
  }

  const netIncome = Math.max(0, profile.grossMonthlyIncome - totalDeductions);
  return { netIncome, deductions };
}

export function checkSNAP(profile: UserProfile): ProgramResult {
  const reasoning: string[] = [];
  const caveats: string[] = [];

  // Already receiving
  if (profile.currentBenefits.includes('snap')) {
    return {
      programId: 'snap',
      programName: 'SNAP (Food Assistance)',
      description: 'Monthly funds on an EBT card to buy groceries.',
      status: 'likely_ineligible',
      reasoning: ['You indicated you already receive SNAP benefits.'],
      caveats: [],
      applyUrl: 'https://dhs.dc.gov/page/public-benefits',
      applyInstructions: 'Apply through the DC DHS public benefits portal or visit a DHS service center.',
      sourceUrls: SOURCE_URLS,
    };
  }

  // Must be DC resident
  if (!profile.isDCResident) {
    return {
      programId: 'snap',
      programName: 'SNAP (Food Assistance)',
      description: 'Monthly funds on an EBT card to buy groceries.',
      status: 'likely_ineligible',
      reasoning: ['SNAP requires DC residency.'],
      caveats: [],
      applyUrl: 'https://dhs.dc.gov/page/public-benefits',
      applyInstructions: 'Apply through the DC DHS public benefits portal or visit a DHS service center.',
      sourceUrls: SOURCE_URLS,
    };
  }

  // Citizenship check — undocumented residents generally not eligible for SNAP
  // but qualified immigrants (5-year bar) and some categories are eligible
  if (profile.citizenshipStatus === 'undocumented') {
    return {
      programId: 'snap',
      programName: 'SNAP (Food Assistance)',
      description: 'Monthly funds on an EBT card to buy groceries.',
      status: 'likely_ineligible',
      reasoning: ['SNAP generally requires U.S. citizenship or qualified immigration status.'],
      caveats: ['Some household members may still be eligible. A mixed-status household can apply for eligible members.'],
      applyUrl: 'https://dhs.dc.gov/page/public-benefits',
      applyInstructions: 'Apply through the DC DHS public benefits portal or visit a DHS service center.',
      sourceUrls: SOURCE_URLS,
    };
  }

  // Gross income test: 200% FPL (DC uses Broad-Based Categorical Eligibility)
  // Source: https://www.snapscreener.com/guides/district-of-columbia
  const grossLimit = getFPLAtPercent(profile.householdSize, 200);
  const annualGross = profile.grossMonthlyIncome * 12;

  if (annualGross > grossLimit) {
    reasoning.push(
      `Your annual gross income ($${annualGross.toLocaleString()}) exceeds the DC gross income limit of $${grossLimit.toLocaleString()} (200% FPL for a household of ${profile.householdSize}).`
    );
    return {
      programId: 'snap',
      programName: 'SNAP (Food Assistance)',
      description: 'Monthly funds on an EBT card to buy groceries.',
      status: 'likely_ineligible',
      reasoning,
      caveats: ['If you have elderly or disabled household members, different rules may apply.'],
      applyUrl: 'https://dhs.dc.gov/page/public-benefits',
      applyInstructions: 'Apply through the DC DHS public benefits portal or visit a DHS service center.',
      sourceUrls: SOURCE_URLS,
    };
  }

  reasoning.push(
    `Your annual gross income ($${annualGross.toLocaleString()}) is within the DC gross income limit of $${grossLimit.toLocaleString()} (200% FPL).`
  );

  // Net income test: 100% FPL
  // Source: https://www.fns.usda.gov/snap/eligibility
  const { netIncome, deductions } = calculateNetIncome(profile);
  const netLimit = Math.round(getFPLAtPercent(profile.householdSize, 100) / 12);

  // Calculate estimated benefit
  const maxAllotment = getMaxAllotment(profile.householdSize);
  const expectedContribution = Math.round(netIncome * NET_INCOME_CONTRIBUTION_RATE);
  let estimatedMonthly = Math.max(0, maxAllotment - expectedContribution);

  // DC minimum benefit: $30 (state-funded)
  // Source: https://www.snapscreener.com/guides/district-of-columbia
  if (estimatedMonthly > 0 && estimatedMonthly < DC_MINIMUM_BENEFIT) {
    estimatedMonthly = DC_MINIMUM_BENEFIT;
  }

  if (netIncome > netLimit) {
    reasoning.push(
      `Your estimated net monthly income ($${netIncome.toLocaleString()}) exceeds the net income limit of $${netLimit.toLocaleString()} (100% FPL). However, DC uses broad-based categorical eligibility, which may waive the net income test.`
    );
    caveats.push('DC uses broad-based categorical eligibility (BBCE), which may allow approval even if net income exceeds 100% FPL. Apply to get an official determination.');

    return {
      programId: 'snap',
      programName: 'SNAP (Food Assistance)',
      description: 'Monthly funds on an EBT card to buy groceries.',
      status: 'may_be_eligible',
      estimatedBenefit: estimatedMonthly > 0 ? {
        monthly: estimatedMonthly,
        annual: estimatedMonthly * 12,
        label: `Up to $${estimatedMonthly}/month in SNAP benefits`,
      } : undefined,
      reasoning,
      caveats,
      applyUrl: 'https://dhs.dc.gov/page/public-benefits',
      applyInstructions: 'Apply through the DC DHS public benefits portal or visit a DHS service center.',
      sourceUrls: SOURCE_URLS,
    };
  }

  reasoning.push(
    `Your estimated net monthly income ($${netIncome.toLocaleString()}) is within the net income limit of $${netLimit.toLocaleString()} (100% FPL).`
  );
  reasoning.push(`Deductions applied: ${deductions.join('; ')}`);

  // DC has no asset test (BBCE)
  // Source: https://www.snapscreener.com/guides/district-of-columbia
  reasoning.push('DC does not apply an asset test for SNAP (broad-based categorical eligibility).');

  // ABAWD work requirements
  // Source: https://www.snapscreener.com/guides/district-of-columbia
  const isABAWD = profile.age >= 18 && profile.age <= 54 &&
    !profile.hasDisability &&
    profile.childrenUnder18 === 0;
  if (isABAWD && (profile.employmentStatus === 'unemployed_not_looking')) {
    caveats.push(
      'As an able-bodied adult without dependents (ABAWD, ages 18-54), you may need to meet work requirements to keep benefits beyond 3 months.'
    );
  }

  return {
    programId: 'snap',
    programName: 'SNAP (Food Assistance)',
    description: 'Monthly funds on an EBT card to buy groceries.',
    status: 'likely_eligible',
    estimatedBenefit: {
      monthly: estimatedMonthly,
      annual: estimatedMonthly * 12,
      label: `Up to $${estimatedMonthly}/month in SNAP benefits`,
    },
    reasoning,
    caveats,
    applyUrl: 'https://dhs.dc.gov/page/public-benefits',
    applyInstructions: 'Apply through the DC DHS public benefits portal or visit a DHS service center.',
    sourceUrls: SOURCE_URLS,
  };
}
