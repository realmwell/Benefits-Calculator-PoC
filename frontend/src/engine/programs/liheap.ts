/**
 * LIHEAP (Low Income Home Energy Assistance Program) — DC Eligibility Checker
 *
 * Sources:
 * - DC DOEE: https://doee.dc.gov/liheap
 * - LIHEAP DC profile: https://liheapch.acf.gov/profiles/DC.htm
 */

import type { UserProfile, ProgramResult } from '../types';
import { getSMI60 } from '../data/fpl';

const SOURCE_URLS = [
  'https://doee.dc.gov/liheap',
  'https://liheapch.acf.gov/profiles/DC.htm',
];

export function checkLIHEAP(profile: UserProfile): ProgramResult {
  const reasoning: string[] = [];
  const caveats: string[] = [];

  if (profile.currentBenefits.includes('liheap')) {
    return {
      programId: 'liheap',
      programName: 'LIHEAP (Energy Assistance)',
      description: 'Help paying heating and cooling bills, plus crisis assistance and weatherization.',
      status: 'likely_ineligible',
      reasoning: ['You indicated you already receive LIHEAP benefits.'],
      caveats: ['LIHEAP operates on an annual cycle. You may need to reapply each year.'],
      applyUrl: 'https://doee.dc.gov/liheap',
      applyInstructions: 'Apply through DOEE or a community-based organization.',
      sourceUrls: SOURCE_URLS,
    };
  }

  if (!profile.isDCResident) {
    return {
      programId: 'liheap',
      programName: 'LIHEAP (Energy Assistance)',
      description: 'Help paying heating and cooling bills, plus crisis assistance and weatherization.',
      status: 'likely_ineligible',
      reasoning: ['LIHEAP requires DC residency.'],
      caveats: [],
      applyUrl: 'https://doee.dc.gov/liheap',
      applyInstructions: 'Apply through DOEE or a community-based organization.',
      sourceUrls: SOURCE_URLS,
    };
  }

  // Must be responsible for energy costs
  if (profile.housingSituation === 'homeless') {
    reasoning.push('LIHEAP requires that you are responsible for home energy costs.');
    return {
      programId: 'liheap',
      programName: 'LIHEAP (Energy Assistance)',
      description: 'Help paying heating and cooling bills, plus crisis assistance and weatherization.',
      status: 'likely_ineligible',
      reasoning,
      caveats: ['If you have a utility account, you may still qualify. Contact DOEE for details.'],
      applyUrl: 'https://doee.dc.gov/liheap',
      applyInstructions: 'Apply through DOEE or a community-based organization.',
      sourceUrls: SOURCE_URLS,
    };
  }

  // Income test: 60% of State Median Income
  // Source: https://liheapch.acf.gov/profiles/DC.htm
  const annualIncome = profile.annualIncome || profile.grossMonthlyIncome * 12;
  const smiLimit = getSMI60(profile.householdSize);

  if (annualIncome > smiLimit) {
    reasoning.push(
      `Your annual income ($${annualIncome.toLocaleString()}) exceeds the LIHEAP income limit of $${smiLimit.toLocaleString()} (60% of State Median Income) for a household of ${profile.householdSize}.`
    );
    return {
      programId: 'liheap',
      programName: 'LIHEAP (Energy Assistance)',
      description: 'Help paying heating and cooling bills, plus crisis assistance and weatherization.',
      status: 'likely_ineligible',
      reasoning,
      caveats: [],
      applyUrl: 'https://doee.dc.gov/liheap',
      applyInstructions: 'Apply through DOEE or a community-based organization.',
      sourceUrls: SOURCE_URLS,
    };
  }

  reasoning.push(
    `Your annual income ($${annualIncome.toLocaleString()}) is within the LIHEAP limit of $${smiLimit.toLocaleString()} (60% SMI).`
  );

  if (profile.monthlyUtilities > 0) {
    reasoning.push(`You have monthly utility expenses of $${profile.monthlyUtilities}.`);
  }

  // Benefit estimates
  // Source: https://liheapch.acf.gov/profiles/DC.htm
  caveats.push('Heating/cooling assistance ranges from $250-$1,800 depending on need and household size.');
  caveats.push('Crisis assistance up to $750 is available for energy emergencies.');
  caveats.push('Weatherization services up to $25,000 may also be available.');
  caveats.push('LIHEAP is seasonal — applications typically open in fall/winter for heating assistance.');

  return {
    programId: 'liheap',
    programName: 'LIHEAP (Energy Assistance)',
    description: 'Help paying heating and cooling bills, plus crisis assistance and weatherization.',
    status: 'likely_eligible',
    estimatedBenefit: {
      annual: 1000, // rough midpoint
      label: 'Heating/cooling assistance: $250-$1,800; crisis assistance: up to $750',
    },
    reasoning,
    caveats,
    applyUrl: 'https://doee.dc.gov/liheap',
    applyInstructions: 'Apply through the DC Department of Energy & Environment (DOEE) or a community-based organization.',
    sourceUrls: SOURCE_URLS,
  };
}
