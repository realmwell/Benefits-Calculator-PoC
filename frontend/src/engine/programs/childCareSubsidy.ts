/**
 * DC Child Care Subsidy Program — Eligibility Checker
 *
 * Sources:
 * - OSSE FAQ: https://osse.dc.gov/childcaresubsidyfaq
 * - My Child Care DC: https://mychildcare.dc.gov/MyChildCare/PayingForChildCare/2603/0
 */

import type { UserProfile, ProgramResult } from '../types';
import { getFPLAtPercent } from '../data/fpl';

const SOURCE_URLS = [
  'https://osse.dc.gov/childcaresubsidyfaq',
  'https://mychildcare.dc.gov/MyChildCare/PayingForChildCare/2603/0',
];

export function checkChildCareSubsidy(profile: UserProfile): ProgramResult {
  const reasoning: string[] = [];
  const caveats: string[] = [];

  if (profile.currentBenefits.includes('child_care_subsidy')) {
    return {
      programId: 'child_care_subsidy',
      programName: 'DC Child Care Subsidy',
      description: 'Help paying for child care while you work or attend school.',
      status: 'likely_ineligible',
      reasoning: ['You indicated you already receive the DC Child Care Subsidy.'],
      caveats: [],
      applyUrl: 'https://mychildcare.dc.gov',
      applyInstructions: 'Apply through mychildcare.dc.gov or visit a DHS service center.',
      sourceUrls: SOURCE_URLS,
    };
  }

  if (!profile.isDCResident) {
    return {
      programId: 'child_care_subsidy',
      programName: 'DC Child Care Subsidy',
      description: 'Help paying for child care while you work or attend school.',
      status: 'likely_ineligible',
      reasoning: ['The DC Child Care Subsidy requires DC residency.'],
      caveats: [],
      applyUrl: 'https://mychildcare.dc.gov',
      applyInstructions: 'Apply through mychildcare.dc.gov or visit a DHS service center.',
      sourceUrls: SOURCE_URLS,
    };
  }

  // Must have children under 13 (or under 19 if disabled)
  const eligibleChildren = profile.childrenAges.filter(age => age < 13);
  if (eligibleChildren.length === 0 && profile.childrenUnder18 === 0) {
    reasoning.push('The child care subsidy is for families with children under 13 (or under 19 if the child has a disability).');
    return {
      programId: 'child_care_subsidy',
      programName: 'DC Child Care Subsidy',
      description: 'Help paying for child care while you work or attend school.',
      status: 'likely_ineligible',
      reasoning,
      caveats: [],
      applyUrl: 'https://mychildcare.dc.gov',
      applyInstructions: 'Apply through mychildcare.dc.gov or visit a DHS service center.',
      sourceUrls: SOURCE_URLS,
    };
  }

  // Must need child care for work/school
  const isWorkingOrStudent = ['employed_full', 'employed_part', 'self_employed', 'student'].includes(
    profile.employmentStatus
  );

  // Auto-eligible: TANF recipients, SNAP E&T, foster care, homeless
  // Source: https://mychildcare.dc.gov/MyChildCare/PayingForChildCare/2603/0
  const hasAutoEligibility =
    profile.currentBenefits.includes('tanf') ||
    profile.housingSituation === 'homeless';

  if (hasAutoEligibility) {
    reasoning.push('As a TANF recipient or family experiencing homelessness, you are automatically eligible for the child care subsidy.');
  } else if (!isWorkingOrStudent) {
    reasoning.push('The child care subsidy generally requires that you are working, in school, or in a training program.');
    return {
      programId: 'child_care_subsidy',
      programName: 'DC Child Care Subsidy',
      description: 'Help paying for child care while you work or attend school.',
      status: 'may_be_eligible',
      reasoning,
      caveats: ['If you are in a job training program or looking for work, you may still qualify. Apply for an official determination.'],
      applyUrl: 'https://mychildcare.dc.gov',
      applyInstructions: 'Apply through mychildcare.dc.gov or visit a DHS service center.',
      sourceUrls: SOURCE_URLS,
    };
  } else {
    reasoning.push('You are working or in school and have children who need care.');
  }

  // Income test (approximately 250% FPL for initial eligibility)
  const annualIncome = profile.annualIncome || profile.grossMonthlyIncome * 12;
  const incomeLimit = getFPLAtPercent(profile.householdSize, 250);

  if (!hasAutoEligibility && annualIncome > incomeLimit) {
    reasoning.push(
      `Your annual income ($${annualIncome.toLocaleString()}) may exceed the child care subsidy income limit (approximately $${incomeLimit.toLocaleString()}).`
    );
    return {
      programId: 'child_care_subsidy',
      programName: 'DC Child Care Subsidy',
      description: 'Help paying for child care while you work or attend school.',
      status: 'likely_ineligible',
      reasoning,
      caveats: ['Income limits vary. Apply for an official determination.'],
      applyUrl: 'https://mychildcare.dc.gov',
      applyInstructions: 'Apply through mychildcare.dc.gov or visit a DHS service center.',
      sourceUrls: SOURCE_URLS,
    };
  }

  if (!hasAutoEligibility) {
    reasoning.push(
      `Your annual income ($${annualIncome.toLocaleString()}) appears to be within the child care subsidy income guidelines.`
    );
  }

  caveats.push('You will have a copay based on your income level.');
  caveats.push('Care must be provided by a licensed or registered child care provider.');

  return {
    programId: 'child_care_subsidy',
    programName: 'DC Child Care Subsidy',
    description: 'Help paying for child care while you work or attend school.',
    status: hasAutoEligibility ? 'likely_eligible' : 'may_be_eligible',
    reasoning,
    caveats,
    applyUrl: 'https://mychildcare.dc.gov',
    applyInstructions: 'Apply through mychildcare.dc.gov or visit a DHS service center.',
    sourceUrls: SOURCE_URLS,
  };
}
