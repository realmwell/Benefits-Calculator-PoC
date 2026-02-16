/**
 * DC Property Tax Relief — Eligibility Checker
 *
 * Covers: Homestead Deduction, Assessment Cap, Senior/Disabled Relief,
 *         Schedule H Credit, Low-Income Deferral
 *
 * Source: https://otr.cfo.dc.gov/page/real-property-tax-reliefs-credits-and-deductions
 * Source: https://otr.cfo.dc.gov/page/real-property-tax-relief-and-tax-credits
 */

import type { UserProfile, ProgramResult, EstimatedBenefit } from '../types';

const SOURCE_URLS = [
  'https://otr.cfo.dc.gov/page/real-property-tax-reliefs-credits-and-deductions',
  'https://otr.cfo.dc.gov/page/real-property-tax-relief-and-tax-credits',
];

// Homestead deduction: reduces assessed value by $89,850
// Source: https://otr.cfo.dc.gov/page/real-property-tax-relief-and-tax-credits
const HOMESTEAD_DEDUCTION = 89850;

// Senior/Disabled: 50% property tax reduction, AGI under $163,500
// Source: https://otr.cfo.dc.gov/page/real-property-tax-reliefs-credits-and-deductions
const SENIOR_DISABLED_AGI_LIMIT = 163500;

// Schedule H: household income $20,000 or less, credit up to $750
// Source: https://otr.cfo.dc.gov/page/real-property-tax-relief-and-tax-credits
const SCHEDULE_H_INCOME_LIMIT = 20000;
const SCHEDULE_H_MAX_CREDIT = 750;

// Low-Income Deferral: AGI $50,000 or less
// Source: https://otr.cfo.dc.gov/page/real-property-tax-relief-and-tax-credits
const LOW_INCOME_DEFERRAL_LIMIT = 50000;

export function checkPropertyTax(profile: UserProfile): ProgramResult {
  const reasoning: string[] = [];
  const caveats: string[] = [];
  const qualifyingPrograms: string[] = [];

  if (!profile.isDCResident) {
    return makeResult('likely_ineligible', ['Property tax relief requires DC residency.'], [], undefined);
  }

  const annualIncome = profile.annualIncome || profile.grossMonthlyIncome * 12;
  const isHomeowner = profile.housingSituation === 'own';
  const isRenter = profile.housingSituation === 'rent';
  const isSeniorOrDisabled = profile.age >= 65 || profile.hasDisability || profile.adultsOver65 > 0;

  // ── Schedule H Credit (available to both homeowners AND renters) ──
  // Source: https://otr.cfo.dc.gov/page/real-property-tax-relief-and-tax-credits
  if (annualIncome <= SCHEDULE_H_INCOME_LIMIT) {
    qualifyingPrograms.push('Schedule H Property Tax Credit');
    reasoning.push(
      `Your household income ($${annualIncome.toLocaleString()}) is $${SCHEDULE_H_INCOME_LIMIT.toLocaleString()} or less, qualifying you for the Schedule H credit (up to $${SCHEDULE_H_MAX_CREDIT}).`
    );
    if (isRenter) {
      reasoning.push('Renters can also claim the Schedule H credit based on the property tax portion of rent.');
    }
  }

  if (!isHomeowner && !isRenter) {
    if (qualifyingPrograms.length === 0) {
      reasoning.push('Most property tax relief programs require you to own or rent a home in DC.');
      return makeResult('likely_ineligible', reasoning, [], undefined);
    }
  }

  if (isHomeowner) {
    // ── Homestead Deduction ──
    // Source: https://otr.cfo.dc.gov/page/real-property-tax-relief-and-tax-credits
    if (profile.hasHomesteadDeduction === false || profile.hasHomesteadDeduction === null) {
      qualifyingPrograms.push('Homestead Deduction');
      reasoning.push(
        `The Homestead Deduction reduces your assessed value by $${HOMESTEAD_DEDUCTION.toLocaleString()} (no income limit). You ${profile.hasHomesteadDeduction === false ? "haven't filed" : "may not have filed"} for this yet.`
      );
    } else {
      reasoning.push('You already have the Homestead Deduction filed.');
    }

    // ── Assessment Cap Credit (automatic if homestead filed) ──
    // Source: https://otr.cfo.dc.gov/page/real-property-tax-relief-and-tax-credits
    reasoning.push('The Assessment Cap Credit (limits assessed value increases to 10%/year) is automatic once Homestead is filed.');

    // ── Senior/Disabled Tax Relief ──
    if (isSeniorOrDisabled && annualIncome <= SENIOR_DISABLED_AGI_LIMIT) {
      qualifyingPrograms.push('Senior/Disabled 50% Tax Reduction');
      reasoning.push(
        `As a ${profile.age >= 65 ? 'senior (65+)' : 'person with a disability'} with income under $${SENIOR_DISABLED_AGI_LIMIT.toLocaleString()}, you may qualify for a 50% property tax reduction.`
      );
    }

    // ── Low-Income Deferral ──
    if (annualIncome <= LOW_INCOME_DEFERRAL_LIMIT) {
      qualifyingPrograms.push('Low-Income Tax Deferral');
      reasoning.push(
        `With income of $${annualIncome.toLocaleString()} (under $${LOW_INCOME_DEFERRAL_LIMIT.toLocaleString()}), you may defer property tax increases.`
      );
    }
  }

  if (qualifyingPrograms.length === 0) {
    reasoning.push('Based on your answers, you do not appear to qualify for DC property tax relief programs.');
    return makeResult('likely_ineligible', reasoning, [], undefined);
  }

  let benefit: EstimatedBenefit | undefined;
  if (annualIncome <= SCHEDULE_H_INCOME_LIMIT) {
    benefit = {
      annual: SCHEDULE_H_MAX_CREDIT,
      label: `Schedule H credit: up to $${SCHEDULE_H_MAX_CREDIT}/year${qualifyingPrograms.length > 1 ? ', plus additional relief' : ''}`,
    };
  }

  caveats.push('You must file the appropriate forms with the DC Office of Tax and Revenue.');

  return makeResult(
    'likely_eligible',
    reasoning,
    caveats,
    benefit,
    `Qualifying programs: ${qualifyingPrograms.join(', ')}`
  );
}

function makeResult(
  status: ProgramResult['status'],
  reasoning: string[],
  caveats: string[],
  estimatedBenefit?: EstimatedBenefit,
  extraDescription?: string,
): ProgramResult {
  return {
    programId: 'property_tax',
    programName: 'DC Property Tax Relief',
    description: extraDescription || 'Tax relief for DC homeowners and renters, including Homestead Deduction, Senior/Disabled credits, and Schedule H.',
    status,
    estimatedBenefit,
    reasoning,
    caveats,
    applyUrl: 'https://otr.cfo.dc.gov/page/real-property-tax-reliefs-credits-and-deductions',
    applyInstructions: 'File with the DC Office of Tax and Revenue (OTR). Homestead applications can be filed online.',
    sourceUrls: SOURCE_URLS,
  };
}
