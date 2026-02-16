/**
 * SSI (Supplemental Security Income) — Eligibility Checker
 *
 * Sources:
 * - SSA SSI: https://www.ssa.gov/ssi
 * - SSA benefit amounts: https://www.ssa.gov/oact/cola/SSIamts.html
 */

import type { UserProfile, ProgramResult } from '../types';

const SOURCE_URLS = [
  'https://www.ssa.gov/ssi',
  'https://www.ssa.gov/oact/cola/SSIamts.html',
];

// Federal Benefit Rate (2025)
// Source: https://www.ssa.gov/oact/cola/SSIamts.html
const FBR_INDIVIDUAL = 967;
const FBR_COUPLE = 1450;

// Resource limits
// Source: https://www.ssa.gov/ssi
const RESOURCE_LIMIT_INDIVIDUAL = 2000;
const RESOURCE_LIMIT_COUPLE = 3000;

export function checkSSI(profile: UserProfile): ProgramResult {
  const reasoning: string[] = [];
  const caveats: string[] = [];

  if (profile.currentBenefits.includes('ssi_ssdi')) {
    return {
      programId: 'ssi',
      programName: 'SSI (Supplemental Security Income)',
      description: 'Monthly cash payments for people who are 65+, blind, or disabled with limited income and resources.',
      status: 'likely_ineligible',
      reasoning: ['You indicated you already receive SSI or SSDI.'],
      caveats: [],
      applyUrl: 'https://www.ssa.gov/ssi',
      applyInstructions: 'Apply at your local Social Security office or at ssa.gov.',
      sourceUrls: SOURCE_URLS,
    };
  }

  // Must be 65+ OR disabled OR blind
  const qualifiesByAge = profile.age >= 65;
  const qualifiesByDisability = profile.hasDisability;

  if (!qualifiesByAge && !qualifiesByDisability) {
    reasoning.push('SSI requires that you are age 65 or older, blind, or have a qualifying disability.');
    return {
      programId: 'ssi',
      programName: 'SSI (Supplemental Security Income)',
      description: 'Monthly cash payments for people who are 65+, blind, or disabled with limited income and resources.',
      status: 'likely_ineligible',
      reasoning,
      caveats: [],
      applyUrl: 'https://www.ssa.gov/ssi',
      applyInstructions: 'Apply at your local Social Security office or at ssa.gov.',
      sourceUrls: SOURCE_URLS,
    };
  }

  if (qualifiesByAge) reasoning.push('You are 65 or older, which meets the age requirement for SSI.');
  if (qualifiesByDisability) reasoning.push('You reported having a disability that limits your ability to work.');

  // Citizenship check
  if (profile.citizenshipStatus === 'undocumented') {
    reasoning.push('SSI requires U.S. citizenship or qualifying immigration status.');
    return {
      programId: 'ssi',
      programName: 'SSI (Supplemental Security Income)',
      description: 'Monthly cash payments for people who are 65+, blind, or disabled with limited income and resources.',
      status: 'likely_ineligible',
      reasoning,
      caveats: [],
      applyUrl: 'https://www.ssa.gov/ssi',
      applyInstructions: 'Apply at your local Social Security office or at ssa.gov.',
      sourceUrls: SOURCE_URLS,
    };
  }

  // Income check (rough — SSI has complex income counting rules)
  // Generally, countable income must be below the FBR
  const isCouple = profile.relationshipStatus === 'married';
  const fbr = isCouple ? FBR_COUPLE : FBR_INDIVIDUAL;

  // Rough income test: earned income has $65 exclusion + 50% disregard,
  // unearned has $20 general exclusion
  const estimatedCountableIncome = Math.max(0, profile.grossMonthlyIncome - 85) * 0.5;

  if (estimatedCountableIncome > fbr) {
    reasoning.push(
      `Your estimated countable income ($${Math.round(estimatedCountableIncome)}/month) may exceed the SSI federal benefit rate of $${fbr}/month.`
    );
    return {
      programId: 'ssi',
      programName: 'SSI (Supplemental Security Income)',
      description: 'Monthly cash payments for people who are 65+, blind, or disabled with limited income and resources.',
      status: 'likely_ineligible',
      reasoning,
      caveats: ['SSI income counting is complex. Apply for an official determination at Social Security.'],
      applyUrl: 'https://www.ssa.gov/ssi',
      applyInstructions: 'Apply at your local Social Security office or at ssa.gov.',
      sourceUrls: SOURCE_URLS,
    };
  }

  reasoning.push(`Your income appears low enough to potentially qualify for SSI.`);

  // Resource limits
  const resourceLimit = isCouple ? RESOURCE_LIMIT_COUPLE : RESOURCE_LIMIT_INDIVIDUAL;
  caveats.push(
    `SSI has a resource limit of $${resourceLimit.toLocaleString()} (${isCouple ? 'couple' : 'individual'}). Resources include cash, bank accounts, and countable assets.`
  );
  caveats.push('DC does not supplement the federal SSI payment.');

  // Estimate benefit
  const estimatedBenefit = Math.max(0, fbr - Math.round(estimatedCountableIncome));

  return {
    programId: 'ssi',
    programName: 'SSI (Supplemental Security Income)',
    description: 'Monthly cash payments for people who are 65+, blind, or disabled with limited income and resources.',
    status: estimatedBenefit > fbr * 0.5 ? 'likely_eligible' : 'may_be_eligible',
    estimatedBenefit: {
      monthly: estimatedBenefit,
      annual: estimatedBenefit * 12,
      label: `Up to $${fbr}/month (${isCouple ? 'couple' : 'individual'} rate)`,
    },
    reasoning,
    caveats,
    applyUrl: 'https://www.ssa.gov/ssi',
    applyInstructions: 'Apply at your local Social Security office or call 1-800-772-1213.',
    sourceUrls: SOURCE_URLS,
  };
}
