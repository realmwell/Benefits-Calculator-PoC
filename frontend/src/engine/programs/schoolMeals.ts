/**
 * Free and Reduced School Meals (NSLP) — DC Eligibility Checker
 *
 * Sources:
 * - OSSE: https://osse.dc.gov/service/national-school-lunch-program
 * - Income guidelines: https://www.fns.usda.gov/cn/income-eligibility-guidelines
 */

import type { UserProfile, ProgramResult } from '../types';
import { getFPLAtPercent } from '../data/fpl';

const SOURCE_URLS = [
  'https://osse.dc.gov/service/national-school-lunch-program',
  'https://www.fns.usda.gov/cn/income-eligibility-guidelines',
];

export function checkSchoolMeals(profile: UserProfile): ProgramResult {
  const reasoning: string[] = [];
  const caveats: string[] = [];

  if (profile.currentBenefits.includes('school_meals')) {
    return makeResult('likely_ineligible', ['You indicated your children already receive free or reduced school meals.'], []);
  }

  if (!profile.isDCResident) {
    return makeResult('likely_ineligible', ['School meal programs require DC residency and school enrollment.'], []);
  }

  // Must have school-age children (roughly 5-18)
  const schoolAgeChildren = profile.childrenAges.filter(age => age >= 5 && age <= 18);
  if (schoolAgeChildren.length === 0 && profile.childrenUnder18 === 0) {
    reasoning.push('Free and reduced school meals are for children enrolled in school.');
    return makeResult('likely_ineligible', reasoning, []);
  }

  // Many DC schools operate CEP — free meals for all students
  // Source: https://osse.dc.gov/service/national-school-lunch-program
  reasoning.push('Many DC schools operate the Community Eligibility Provision (CEP), providing free meals to all students regardless of income.');

  // Check categorical eligibility (SNAP or TANF)
  const hasCategoricalEligibility = profile.currentBenefits.some(b =>
    ['snap', 'tanf'].includes(b)
  );

  if (hasCategoricalEligibility) {
    reasoning.push('Your household receives SNAP or TANF, which provides automatic eligibility for free school meals.');
    return makeResult('likely_eligible', reasoning, caveats);
  }

  // Income test
  const annualIncome = profile.annualIncome || profile.grossMonthlyIncome * 12;

  // Free meals: 130% FPL
  // Source: https://www.fns.usda.gov/cn/income-eligibility-guidelines
  const freeLimit = getFPLAtPercent(profile.householdSize, 130);

  // Reduced-price meals: 185% FPL
  const reducedLimit = getFPLAtPercent(profile.householdSize, 185);

  if (annualIncome <= freeLimit) {
    reasoning.push(
      `Your annual income ($${annualIncome.toLocaleString()}) is within the free meals limit of $${freeLimit.toLocaleString()} (130% FPL).`
    );
    return makeResult('likely_eligible', reasoning, caveats);
  }

  if (annualIncome <= reducedLimit) {
    reasoning.push(
      `Your annual income ($${annualIncome.toLocaleString()}) qualifies for reduced-price meals (130-185% FPL, limit $${reducedLimit.toLocaleString()}).`
    );
    caveats.push('Reduced-price meals cost no more than $0.40 for lunch and $0.30 for breakfast.');
    return makeResult('likely_eligible', reasoning, caveats);
  }

  reasoning.push(
    `Your annual income ($${annualIncome.toLocaleString()}) exceeds the reduced-price meals limit of $${reducedLimit.toLocaleString()} (185% FPL).`
  );
  caveats.push('If your children attend a CEP school, they still receive free meals regardless of income.');

  return makeResult('may_be_eligible', reasoning, caveats);
}

function makeResult(
  status: ProgramResult['status'],
  reasoning: string[],
  caveats: string[],
): ProgramResult {
  return {
    programId: 'school_meals',
    programName: 'Free and Reduced School Meals',
    description: 'Free or reduced-price breakfast and lunch at school for eligible children.',
    status,
    reasoning,
    caveats,
    applyUrl: 'https://osse.dc.gov/service/national-school-lunch-program',
    applyInstructions: "Contact your child's school to apply or check if the school participates in CEP.",
    sourceUrls: SOURCE_URLS,
  };
}
