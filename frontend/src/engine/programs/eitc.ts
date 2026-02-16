/**
 * DC Earned Income Tax Credit (DC EITC) — Eligibility Checker
 *
 * Sources:
 * - DC OTR: https://otr.cfo.dc.gov/page/dc-eitc
 * - DISB campaign: https://disb.dc.gov/eitc
 * - DC Tax Help: https://disb.dc.gov/dctaxhelp
 */

import type { UserProfile, ProgramResult } from '../types';

const SOURCE_URLS = [
  'https://otr.cfo.dc.gov/page/dc-eitc',
  'https://disb.dc.gov/eitc',
  'https://disb.dc.gov/dctaxhelp',
];

/**
 * Federal EITC maximum amounts by number of qualifying children (2025).
 * Source: https://disb.dc.gov/dctaxhelp
 */
const FEDERAL_EITC_MAX: Record<number, number> = {
  0: 649,
  1: 4328,
  2: 7152,
  3: 8046, // 3 or more
};

/**
 * EITC income limits by filing status and number of children (2025).
 * Source: https://disb.dc.gov/dctaxhelp
 */
const EITC_INCOME_LIMITS = {
  single: {
    0: 19104,
    1: 50434,
    2: 57310,
    3: 61555, // 3 or more
  } as Record<number, number>,
  married: {
    0: 26214,
    1: 57554,
    2: 64430,
    3: 68675, // 3 or more
  } as Record<number, number>,
};

/**
 * DC EITC match rate for tax year 2025.
 * Source: https://disb.dc.gov/eitc
 * DC matches 100% of the federal EITC for TY2025.
 */
const DC_EITC_MATCH_RATE = 1.00;

export function checkEITC(profile: UserProfile): ProgramResult {
  const reasoning: string[] = [];
  const caveats: string[] = [];

  if (profile.currentBenefits.includes('dc_eitc')) {
    return {
      programId: 'dc_eitc',
      programName: 'DC Earned Income Tax Credit (DC EITC)',
      description: 'Tax credit for working DC residents — DC matches 100% of the federal EITC.',
      status: 'likely_ineligible',
      reasoning: ['You indicated you already claimed the DC EITC last tax year.'],
      caveats: ['Make sure to claim it again this year when you file your DC taxes.'],
      applyUrl: 'https://otr.cfo.dc.gov',
      applyInstructions: 'Claim when filing your DC Form D-40 tax return.',
      sourceUrls: SOURCE_URLS,
    };
  }

  if (!profile.isDCResident) {
    return {
      programId: 'dc_eitc',
      programName: 'DC Earned Income Tax Credit (DC EITC)',
      description: 'Tax credit for working DC residents — DC matches 100% of the federal EITC.',
      status: 'likely_ineligible',
      reasoning: ['The DC EITC requires DC residency.'],
      caveats: [],
      applyUrl: 'https://otr.cfo.dc.gov',
      applyInstructions: 'Claim when filing your DC Form D-40 tax return.',
      sourceUrls: SOURCE_URLS,
    };
  }

  // Must have earned income
  if (profile.earnedMonthlyIncome <= 0) {
    reasoning.push('The EITC requires earned income from work (wages, salary, or self-employment).');
    return {
      programId: 'dc_eitc',
      programName: 'DC Earned Income Tax Credit (DC EITC)',
      description: 'Tax credit for working DC residents — DC matches 100% of the federal EITC.',
      status: 'likely_ineligible',
      reasoning,
      caveats: [],
      applyUrl: 'https://otr.cfo.dc.gov',
      applyInstructions: 'Claim when filing your DC Form D-40 tax return.',
      sourceUrls: SOURCE_URLS,
    };
  }

  const annualIncome = profile.annualIncome || profile.grossMonthlyIncome * 12;
  const numChildren = Math.min(profile.childrenUnder18, 3); // 3+ treated the same
  const isMarried = profile.relationshipStatus === 'married';
  const filingStatus = isMarried ? 'married' : 'single';

  const incomeLimit = EITC_INCOME_LIMITS[filingStatus][numChildren];
  const maxFederalEITC = FEDERAL_EITC_MAX[numChildren];
  const maxDCEITC = Math.round(maxFederalEITC * DC_EITC_MATCH_RATE);
  const totalMax = maxFederalEITC + maxDCEITC;

  if (annualIncome > incomeLimit) {
    reasoning.push(
      `Your annual income ($${annualIncome.toLocaleString()}) exceeds the EITC limit of $${incomeLimit.toLocaleString()} for ${filingStatus} filers with ${numChildren} qualifying child${numChildren !== 1 ? 'ren' : ''}.`
    );
    return {
      programId: 'dc_eitc',
      programName: 'DC Earned Income Tax Credit (DC EITC)',
      description: 'Tax credit for working DC residents — DC matches 100% of the federal EITC.',
      status: 'likely_ineligible',
      reasoning,
      caveats: [],
      applyUrl: 'https://otr.cfo.dc.gov',
      applyInstructions: 'Claim when filing your DC Form D-40 tax return.',
      sourceUrls: SOURCE_URLS,
    };
  }

  reasoning.push(
    `Your annual income ($${annualIncome.toLocaleString()}) is within the EITC limit of $${incomeLimit.toLocaleString()} for ${filingStatus} filers with ${numChildren} qualifying child${numChildren !== 1 ? 'ren' : ''}.`
  );
  reasoning.push(`DC matches 100% of the federal EITC for tax year 2025.`);

  // ITIN holders eligible
  // Source: https://otr.cfo.dc.gov/page/dc-eitc
  if (profile.citizenshipStatus === 'undocumented' || profile.citizenshipStatus === 'other_immigration') {
    reasoning.push('DC EITC is available to ITIN holders, even without an SSN.');
  }

  // Monthly payment option
  // Source: https://otr.cfo.dc.gov/page/dc-eitc
  if (totalMax >= 1200) {
    caveats.push(`If your combined EITC is $1,200 or more, you can opt for 12 monthly payments instead of a lump sum.`);
  }

  return {
    programId: 'dc_eitc',
    programName: 'DC Earned Income Tax Credit (DC EITC)',
    description: 'Tax credit for working DC residents — DC matches 100% of the federal EITC.',
    status: 'likely_eligible',
    estimatedBenefit: {
      annual: totalMax,
      label: `Up to $${totalMax.toLocaleString()}/year (federal $${maxFederalEITC.toLocaleString()} + DC $${maxDCEITC.toLocaleString()})`,
    },
    reasoning,
    caveats,
    applyUrl: 'https://otr.cfo.dc.gov',
    applyInstructions: 'Claim when filing your DC Form D-40 tax return with the Office of Tax and Revenue.',
    sourceUrls: SOURCE_URLS,
  };
}
