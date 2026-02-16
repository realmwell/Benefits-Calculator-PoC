/**
 * DC Unemployment Insurance — Eligibility Checker
 *
 * Sources:
 * - DC DOES: https://does.dc.gov/service/unemployment-compensation
 * - Eligibility/calculator: https://www.unemploymentcalculator.org/washington-dc/eligibility
 */

import type { UserProfile, ProgramResult } from '../types';

const SOURCE_URLS = [
  'https://does.dc.gov/service/unemployment-compensation',
  'https://www.unemploymentcalculator.org/washington-dc/eligibility',
];

// Max weekly benefit: $444
// Source: https://www.unemploymentcalculator.org/washington-dc/eligibility
const MAX_WEEKLY_BENEFIT = 444;

// Minimum base period wages: $1,950
// Source: https://www.unemploymentcalculator.org/washington-dc/eligibility
const MIN_BASE_PERIOD_WAGES = 1950;

// Max weeks: 26
const MAX_WEEKS = 26;

export function checkUnemployment(profile: UserProfile): ProgramResult {
  const reasoning: string[] = [];
  const caveats: string[] = [];

  if (profile.currentBenefits.includes('unemployment')) {
    return {
      programId: 'unemployment',
      programName: 'DC Unemployment Insurance',
      description: 'Weekly cash benefits for workers who lost their job through no fault of their own.',
      status: 'likely_ineligible',
      reasoning: ['You indicated you already receive unemployment benefits.'],
      caveats: [],
      applyUrl: 'https://does.dc.gov/service/unemployment-compensation',
      applyInstructions: 'File a claim through the DC DOES website.',
      sourceUrls: SOURCE_URLS,
    };
  }

  // Must be unemployed
  if (!['unemployed_looking', 'unemployed_not_looking'].includes(profile.employmentStatus)) {
    reasoning.push('Unemployment insurance is for workers who have lost their job.');
    return {
      programId: 'unemployment',
      programName: 'DC Unemployment Insurance',
      description: 'Weekly cash benefits for workers who lost their job through no fault of their own.',
      status: 'likely_ineligible',
      reasoning,
      caveats: [],
      applyUrl: 'https://does.dc.gov/service/unemployment-compensation',
      applyInstructions: 'File a claim through the DC DOES website.',
      sourceUrls: SOURCE_URLS,
    };
  }

  // Must have lost job recently
  if (!profile.lostJobRecently) {
    reasoning.push('You indicated you did not lose your job in the last 12 months.');
    return {
      programId: 'unemployment',
      programName: 'DC Unemployment Insurance',
      description: 'Weekly cash benefits for workers who lost their job through no fault of their own.',
      status: 'likely_ineligible',
      reasoning,
      caveats: ['If you lost your job more than 12 months ago, you may have already exhausted your benefit period.'],
      applyUrl: 'https://does.dc.gov/service/unemployment-compensation',
      applyInstructions: 'File a claim through the DC DOES website.',
      sourceUrls: SOURCE_URLS,
    };
  }

  // Must be through no fault
  if (!profile.lostJobNoFault) {
    reasoning.push('You indicated the job loss was not through no fault of your own.');
    reasoning.push('Unemployment insurance generally requires involuntary separation (layoff, reduction in force, etc.).');
    return {
      programId: 'unemployment',
      programName: 'DC Unemployment Insurance',
      description: 'Weekly cash benefits for workers who lost their job through no fault of their own.',
      status: 'may_be_eligible',
      reasoning,
      caveats: ['You may still qualify depending on circumstances. File a claim for an official determination.'],
      applyUrl: 'https://does.dc.gov/service/unemployment-compensation',
      applyInstructions: 'File a claim through the DC DOES website.',
      sourceUrls: SOURCE_URLS,
    };
  }

  reasoning.push('You lost your job recently through no fault of your own.');

  // Minimum wage requirement
  // Source: https://www.unemploymentcalculator.org/washington-dc/eligibility
  const estimatedAnnualWages = profile.earnedMonthlyIncome * 12;
  if (estimatedAnnualWages < MIN_BASE_PERIOD_WAGES) {
    reasoning.push(
      `Your estimated annual earnings ($${estimatedAnnualWages.toLocaleString()}) may be below the minimum base period wages of $${MIN_BASE_PERIOD_WAGES.toLocaleString()}.`
    );
    caveats.push('The base period uses your wages from the first four of the last five completed calendar quarters.');
  }

  // Estimate weekly benefit (rough: ~1/26 of highest quarter wages, capped at $444)
  const estimatedWeekly = Math.min(
    Math.round(profile.earnedMonthlyIncome * 3 / 26),
    MAX_WEEKLY_BENEFIT
  );

  caveats.push('You must be able and available to work and actively seeking employment.');
  caveats.push(`Benefits last up to ${MAX_WEEKS} weeks.`);

  return {
    programId: 'unemployment',
    programName: 'DC Unemployment Insurance',
    description: 'Weekly cash benefits for workers who lost their job through no fault of their own.',
    status: 'likely_eligible',
    estimatedBenefit: estimatedWeekly > 0 ? {
      weekly: estimatedWeekly,
      label: `Up to $${estimatedWeekly}/week for up to ${MAX_WEEKS} weeks (max $${MAX_WEEKLY_BENEFIT}/week)`,
    } : undefined,
    reasoning,
    caveats,
    applyUrl: 'https://does.dc.gov/service/unemployment-compensation',
    applyInstructions: 'File a claim through the DC DOES website as soon as possible after losing your job.',
    sourceUrls: SOURCE_URLS,
  };
}
