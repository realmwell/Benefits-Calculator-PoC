/**
 * WIC (Women, Infants, and Children) — DC Eligibility Checker
 *
 * Sources:
 * - DC Health WIC: https://dchealth.dc.gov/service/wic
 * - USDA WIC eligibility: https://www.fns.usda.gov/wic/wic-eligibility-requirements
 */

import type { UserProfile, ProgramResult } from '../types';
import { getFPLAtPercent } from '../data/fpl';

const SOURCE_URLS = [
  'https://dchealth.dc.gov/service/wic',
  'https://www.fns.usda.gov/wic/wic-eligibility-requirements',
];

export function checkWIC(profile: UserProfile): ProgramResult {
  const reasoning: string[] = [];
  const caveats: string[] = [];

  if (profile.currentBenefits.includes('wic')) {
    return {
      programId: 'wic',
      programName: 'WIC (Women, Infants, and Children)',
      description: 'Nutrition assistance for pregnant/postpartum women, infants, and children under 5.',
      status: 'likely_ineligible',
      reasoning: ['You indicated you already receive WIC benefits.'],
      caveats: [],
      applyUrl: 'https://dchealth.dc.gov/service/wic',
      applyInstructions: 'Contact DC Health WIC to schedule an appointment.',
      sourceUrls: SOURCE_URLS,
    };
  }

  if (!profile.isDCResident) {
    return {
      programId: 'wic',
      programName: 'WIC (Women, Infants, and Children)',
      description: 'Nutrition assistance for pregnant/postpartum women, infants, and children under 5.',
      status: 'likely_ineligible',
      reasoning: ['WIC requires DC residency.'],
      caveats: [],
      applyUrl: 'https://dchealth.dc.gov/service/wic',
      applyInstructions: 'Contact DC Health WIC to schedule an appointment.',
      sourceUrls: SOURCE_URLS,
    };
  }

  // Categorical eligibility: must be pregnant, postpartum, breastfeeding,
  // or have infants/children under 5
  const hasChildUnder5 = profile.childrenAges.some(age => age < 5);
  const isPregnant = profile.isPregnant === true;
  const isBreastfeeding = profile.isBreastfeeding;

  if (!isPregnant && !isBreastfeeding && !hasChildUnder5) {
    reasoning.push('WIC is for pregnant women, breastfeeding mothers (up to 12 months), postpartum women (up to 6 months), and children under 5.');
    return {
      programId: 'wic',
      programName: 'WIC (Women, Infants, and Children)',
      description: 'Nutrition assistance for pregnant/postpartum women, infants, and children under 5.',
      status: 'likely_ineligible',
      reasoning,
      caveats: [],
      applyUrl: 'https://dchealth.dc.gov/service/wic',
      applyInstructions: 'Contact DC Health WIC to schedule an appointment.',
      sourceUrls: SOURCE_URLS,
    };
  }

  if (isPregnant) reasoning.push('You are pregnant, which is a qualifying category for WIC.');
  if (isBreastfeeding) reasoning.push('You are breastfeeding, which qualifies for WIC (up to 12 months postpartum).');
  if (hasChildUnder5) {
    const count = profile.childrenAges.filter(a => a < 5).length;
    reasoning.push(`You have ${count} child${count > 1 ? 'ren' : ''} under 5 who may qualify for WIC.`);
  }

  // Income test: 185% FPL
  // Source: https://www.fns.usda.gov/wic/wic-eligibility-requirements
  const annualIncome = profile.annualIncome || profile.grossMonthlyIncome * 12;
  const incomeLimit = getFPLAtPercent(profile.householdSize, 185);

  // Auto-eligible if receiving Medicaid, SNAP, or TANF
  // Source: https://www.fns.usda.gov/wic/wic-eligibility-requirements
  const hasAutoEligibility = profile.currentBenefits.some(b =>
    ['snap', 'medicaid', 'tanf'].includes(b)
  );

  if (hasAutoEligibility) {
    reasoning.push('You currently receive SNAP, Medicaid, or TANF, which provides automatic income eligibility for WIC.');
  } else if (annualIncome <= incomeLimit) {
    reasoning.push(
      `Your annual income ($${annualIncome.toLocaleString()}) is within the WIC income limit of $${incomeLimit.toLocaleString()} (185% FPL).`
    );
  } else {
    reasoning.push(
      `Your annual income ($${annualIncome.toLocaleString()}) exceeds the WIC income limit of $${incomeLimit.toLocaleString()} (185% FPL).`
    );
    return {
      programId: 'wic',
      programName: 'WIC (Women, Infants, and Children)',
      description: 'Nutrition assistance for pregnant/postpartum women, infants, and children under 5.',
      status: 'likely_ineligible',
      reasoning,
      caveats: ['If you receive Medicaid, SNAP, or TANF, you are automatically income-eligible regardless of income.'],
      applyUrl: 'https://dchealth.dc.gov/service/wic',
      applyInstructions: 'Contact DC Health WIC to schedule an appointment.',
      sourceUrls: SOURCE_URLS,
    };
  }

  caveats.push('WIC requires a nutritional risk assessment at an appointment.');
  // WIC is available regardless of immigration status
  if (profile.citizenshipStatus === 'undocumented') {
    reasoning.push('WIC is available regardless of immigration status.');
  }

  return {
    programId: 'wic',
    programName: 'WIC (Women, Infants, and Children)',
    description: 'Nutrition assistance for pregnant/postpartum women, infants, and children under 5.',
    status: 'likely_eligible',
    reasoning,
    caveats,
    applyUrl: 'https://dchealth.dc.gov/service/wic',
    applyInstructions: 'Contact DC Health WIC to schedule an appointment. Bring proof of identity, residency, and income.',
    sourceUrls: SOURCE_URLS,
  };
}
