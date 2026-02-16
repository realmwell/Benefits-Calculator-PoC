/**
 * DC Paid Family Leave — Eligibility Checker
 *
 * Sources:
 * - DC DOES OPFL: https://dcpaidfamilyleave.dc.gov
 * - Benefits calculator: https://dcpaidfamilyleave.dc.gov/benefits-calculator/
 * - Paychex summary: https://www.paychex.com/articles/compliance/washington-dc-paid-family-leave
 */

import type { UserProfile, ProgramResult } from '../types';

const SOURCE_URLS = [
  'https://dcpaidfamilyleave.dc.gov',
  'https://dcpaidfamilyleave.dc.gov/benefits-calculator/',
];

// Max weekly benefit: $1,190
// Source: https://dcpaidfamilyleave.dc.gov/benefits-calculator/
const MAX_WEEKLY_BENEFIT = 1190;

// Benefit: 90% of average weekly wage, capped at max
const BENEFIT_RATE = 0.90;

export function checkPaidFamilyLeave(profile: UserProfile): ProgramResult {
  const reasoning: string[] = [];
  const caveats: string[] = [];

  if (profile.currentBenefits.includes('paid_family_leave')) {
    return {
      programId: 'paid_family_leave',
      programName: 'DC Paid Family Leave',
      description: 'Paid time off for birth/adoption, family illness, or personal medical leave.',
      status: 'likely_ineligible',
      reasoning: ['You indicated you already receive DC Paid Family Leave.'],
      caveats: [],
      applyUrl: 'https://dcpaidfamilyleave.dc.gov',
      applyInstructions: 'File a claim at dcpaidfamilyleave.dc.gov.',
      sourceUrls: SOURCE_URLS,
    };
  }

  // Must work for a DC-covered employer
  const isEmployed = ['employed_full', 'employed_part', 'self_employed'].includes(profile.employmentStatus);

  if (!isEmployed) {
    reasoning.push('DC Paid Family Leave requires current employment with a DC-covered employer.');
    return {
      programId: 'paid_family_leave',
      programName: 'DC Paid Family Leave',
      description: 'Paid time off for birth/adoption, family illness, or personal medical leave.',
      status: 'likely_ineligible',
      reasoning,
      caveats: [],
      applyUrl: 'https://dcpaidfamilyleave.dc.gov',
      applyInstructions: 'File a claim at dcpaidfamilyleave.dc.gov.',
      sourceUrls: SOURCE_URLS,
    };
  }

  if (!profile.worksForDCEmployer) {
    reasoning.push('DC Paid Family Leave requires your employer to be based in DC and paying into the DC Universal Paid Leave fund.');
    return {
      programId: 'paid_family_leave',
      programName: 'DC Paid Family Leave',
      description: 'Paid time off for birth/adoption, family illness, or personal medical leave.',
      status: 'likely_ineligible',
      reasoning,
      caveats: ['If you are unsure whether your employer is DC-covered, check with your HR department.'],
      applyUrl: 'https://dcpaidfamilyleave.dc.gov',
      applyInstructions: 'File a claim at dcpaidfamilyleave.dc.gov.',
      sourceUrls: SOURCE_URLS,
    };
  }

  reasoning.push('You work for a DC-based employer, which likely contributes to the DC Paid Family Leave fund.');

  // Estimate weekly benefit
  // Source: https://dcpaidfamilyleave.dc.gov/benefits-calculator/
  const weeklyWage = Math.round((profile.earnedMonthlyIncome * 12) / 52);
  const weeklyBenefit = Math.min(Math.round(weeklyWage * BENEFIT_RATE), MAX_WEEKLY_BENEFIT);

  // Leave types and durations
  // Source: https://www.paychex.com/articles/compliance/washington-dc-paid-family-leave
  const leaveDetails = [
    'Up to 12 weeks for parental leave (birth or adoption)',
    'Up to 12 weeks for family leave (caring for ill family member)',
    'Up to 12 weeks for medical leave (your own serious health condition)',
    'Up to 2 weeks for prenatal leave',
  ];

  if (profile.isPregnant === true) {
    reasoning.push('As a pregnant worker with a DC employer, you may qualify for prenatal leave plus parental leave.');
  }

  caveats.push('Maximum 12 weeks combined per 52-week period (14 weeks if using prenatal + parental leave).');
  caveats.push('You must have a qualifying event (birth/adoption, family illness, or personal medical condition) to file a claim.');

  return {
    programId: 'paid_family_leave',
    programName: 'DC Paid Family Leave',
    description: 'Paid time off for birth/adoption, family illness, or personal medical leave.',
    status: 'may_be_eligible',
    estimatedBenefit: weeklyBenefit > 0 ? {
      weekly: weeklyBenefit,
      label: `Up to $${weeklyBenefit}/week (90% of wages, max $${MAX_WEEKLY_BENEFIT}/week). Leave types: ${leaveDetails.join('; ')}.`,
    } : undefined,
    reasoning,
    caveats,
    applyUrl: 'https://dcpaidfamilyleave.dc.gov',
    applyInstructions: 'File a claim at dcpaidfamilyleave.dc.gov when you have a qualifying event.',
    sourceUrls: SOURCE_URLS,
  };
}
