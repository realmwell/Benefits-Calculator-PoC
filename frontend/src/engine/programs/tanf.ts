/**
 * TANF (Temporary Assistance for Needy Families) — DC Eligibility Checker
 *
 * Source: https://dhs.dc.gov/service/temporary-cash-assistance-needy-families-tanf
 */

import type { UserProfile, ProgramResult } from '../types';

const SOURCE_URLS = [
  'https://dhs.dc.gov/service/temporary-cash-assistance-needy-families-tanf',
  'https://dhs.dc.gov/page/public-benefits',
];

/**
 * TANF income limits by household size (approximate, DC-specific).
 * Source: https://dhs.dc.gov/service/temporary-cash-assistance-needy-families-tanf
 * Note: These are approximate monthly gross income limits.
 */
const TANF_MONTHLY_INCOME_LIMITS: Record<number, number> = {
  1: 521,
  2: 640,
  3: 751,
  4: 867,
  5: 986,
  6: 1110,
  7: 1238,
  8: 1358,
};

/**
 * TANF monthly benefit amounts by household size (approximate).
 * Source: https://dhs.dc.gov/service/temporary-cash-assistance-needy-families-tanf
 */
const TANF_BENEFIT_AMOUNTS: Record<number, number> = {
  1: 379,
  2: 461,
  3: 535,
  4: 614,
  5: 693,
  6: 773,
  7: 852,
  8: 932,
};

// Resource limit: $3,000 ($4,500 if member 60+)
// Source: https://dhs.dc.gov/service/temporary-cash-assistance-needy-families-tanf
const RESOURCE_LIMIT = 3000;
const RESOURCE_LIMIT_ELDERLY = 4500;

export function checkTANF(profile: UserProfile): ProgramResult {
  const reasoning: string[] = [];
  const caveats: string[] = [];

  if (profile.currentBenefits.includes('tanf')) {
    return {
      programId: 'tanf',
      programName: 'TANF (Temporary Cash Assistance)',
      description: 'Monthly cash assistance for families with dependent children.',
      status: 'likely_ineligible',
      reasoning: ['You indicated you already receive TANF.'],
      caveats: [],
      applyUrl: 'https://dhs.dc.gov/page/public-benefits',
      applyInstructions: 'Apply through the DC DHS public benefits portal.',
      sourceUrls: SOURCE_URLS,
    };
  }

  if (!profile.isDCResident) {
    return {
      programId: 'tanf',
      programName: 'TANF (Temporary Cash Assistance)',
      description: 'Monthly cash assistance for families with dependent children.',
      status: 'likely_ineligible',
      reasoning: ['TANF requires DC residency.'],
      caveats: [],
      applyUrl: 'https://dhs.dc.gov/page/public-benefits',
      applyInstructions: 'Apply through the DC DHS public benefits portal.',
      sourceUrls: SOURCE_URLS,
    };
  }

  // Must have dependent child in home
  if (profile.childrenUnder18 === 0) {
    reasoning.push('TANF requires a dependent child under 18 in the household.');
    return {
      programId: 'tanf',
      programName: 'TANF (Temporary Cash Assistance)',
      description: 'Monthly cash assistance for families with dependent children.',
      status: 'likely_ineligible',
      reasoning,
      caveats: [],
      applyUrl: 'https://dhs.dc.gov/page/public-benefits',
      applyInstructions: 'Apply through the DC DHS public benefits portal.',
      sourceUrls: SOURCE_URLS,
    };
  }

  // Citizenship check
  if (profile.citizenshipStatus === 'undocumented') {
    reasoning.push('TANF generally requires U.S. citizenship or qualified immigration status.');
    return {
      programId: 'tanf',
      programName: 'TANF (Temporary Cash Assistance)',
      description: 'Monthly cash assistance for families with dependent children.',
      status: 'likely_ineligible',
      reasoning,
      caveats: ['U.S. citizen children in the household may still be eligible.'],
      applyUrl: 'https://dhs.dc.gov/page/public-benefits',
      applyInstructions: 'Apply through the DC DHS public benefits portal.',
      sourceUrls: SOURCE_URLS,
    };
  }

  reasoning.push('You have dependent children in your household.');

  // Income test
  const hhSize = Math.min(profile.householdSize, 8);
  const incomeLimit = TANF_MONTHLY_INCOME_LIMITS[hhSize] ||
    TANF_MONTHLY_INCOME_LIMITS[8] + (profile.householdSize - 8) * 120;

  // Add childcare cost adjustments
  // Source: https://dhs.dc.gov/service/temporary-cash-assistance-needy-families-tanf
  let adjustedLimit = incomeLimit;
  const childrenUnder2 = profile.childrenAges.filter(a => a < 2).length;
  const childrenOver2 = profile.childrenAges.filter(a => a >= 2 && a < 18).length;
  adjustedLimit += childrenUnder2 * 200 + childrenOver2 * 175;

  if (profile.grossMonthlyIncome <= adjustedLimit) {
    reasoning.push(
      `Your monthly income ($${profile.grossMonthlyIncome.toLocaleString()}) is within the TANF income limit of $${adjustedLimit.toLocaleString()}/month for your household size.`
    );
  } else {
    reasoning.push(
      `Your monthly income ($${profile.grossMonthlyIncome.toLocaleString()}) exceeds the TANF income limit of $${adjustedLimit.toLocaleString()}/month.`
    );
    return {
      programId: 'tanf',
      programName: 'TANF (Temporary Cash Assistance)',
      description: 'Monthly cash assistance for families with dependent children.',
      status: 'likely_ineligible',
      reasoning,
      caveats: ['Income limits may be adjusted based on deductions. Apply for an official determination.'],
      applyUrl: 'https://dhs.dc.gov/page/public-benefits',
      applyInstructions: 'Apply through the DC DHS public benefits portal.',
      sourceUrls: SOURCE_URLS,
    };
  }

  // Work requirements
  // Source: https://dhs.dc.gov/service/temporary-cash-assistance-needy-families-tanf
  caveats.push('TANF requires participation in work activities through the Office of Work Opportunity (OWO) unless exempt.');

  // Resource limit
  const resourceLimit = profile.adultsOver65 > 0 ? RESOURCE_LIMIT_ELDERLY : RESOURCE_LIMIT;
  caveats.push(`TANF has a resource limit of $${resourceLimit.toLocaleString()} (cash, bank accounts, etc.).`);

  // Estimate benefit
  const benefitAmount = TANF_BENEFIT_AMOUNTS[Math.min(profile.householdSize, 8)] ||
    TANF_BENEFIT_AMOUNTS[8];

  return {
    programId: 'tanf',
    programName: 'TANF (Temporary Cash Assistance)',
    description: 'Monthly cash assistance for families with dependent children.',
    status: 'likely_eligible',
    estimatedBenefit: {
      monthly: benefitAmount,
      annual: benefitAmount * 12,
      label: `Up to $${benefitAmount}/month in cash assistance`,
    },
    reasoning,
    caveats,
    applyUrl: 'https://dhs.dc.gov/page/public-benefits',
    applyInstructions: 'Apply through the DC DHS public benefits portal.',
    sourceUrls: SOURCE_URLS,
  };
}
