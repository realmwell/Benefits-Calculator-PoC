/**
 * Medicaid / DC Healthcare Alliance / DC Healthy Families — Eligibility Checker
 *
 * Sources:
 * - DHCF: https://dhcf.dc.gov
 * - DC Healthcare Alliance: https://dhcf.dc.gov/service/dc-healthcare-alliance
 * - Benefits.gov DC Medicaid: https://www.benefits.gov/benefit/1624
 * - DC Health Link: https://dchealthlink.com
 */

import type { UserProfile, ProgramResult } from '../types';
import { getFPLAtPercent } from '../data/fpl';

const SOURCE_URLS = [
  'https://dhcf.dc.gov',
  'https://dhcf.dc.gov/service/dc-healthcare-alliance',
  'https://www.benefits.gov/benefit/1624',
  'https://dchealthlink.com',
];

export function checkMedicaid(profile: UserProfile): ProgramResult {
  const reasoning: string[] = [];
  const caveats: string[] = [];

  if (profile.currentBenefits.includes('medicaid')) {
    return {
      programId: 'medicaid',
      programName: 'Medicaid / DC Healthcare Alliance',
      description: 'Free or low-cost health coverage for DC residents.',
      status: 'likely_ineligible',
      reasoning: ['You indicated you already receive Medicaid.'],
      caveats: [],
      applyUrl: 'https://dchealthlink.com',
      applyInstructions: 'Apply through DC Health Link or visit a DHS service center.',
      sourceUrls: SOURCE_URLS,
    };
  }

  if (!profile.isDCResident) {
    return {
      programId: 'medicaid',
      programName: 'Medicaid / DC Healthcare Alliance',
      description: 'Free or low-cost health coverage for DC residents.',
      status: 'likely_ineligible',
      reasoning: ['DC Medicaid and Alliance require DC residency.'],
      caveats: [],
      applyUrl: 'https://dchealthlink.com',
      applyInstructions: 'Apply through DC Health Link or visit a DHS service center.',
      sourceUrls: SOURCE_URLS,
    };
  }

  const annualIncome = profile.annualIncome || profile.grossMonthlyIncome * 12;

  // Check age-specific Medicaid thresholds
  // Source: https://www.benefits.gov/benefit/1624

  // Children up to 319% FPL
  const hasChildren = profile.childrenUnder18 > 0;
  const childLimit = getFPLAtPercent(profile.householdSize, 319);

  // Pregnant women up to 319% FPL
  const pregnantLimit = getFPLAtPercent(profile.householdSize, 319);

  // Adults up to 215% FPL (DC expanded Medicaid)
  const adultLimit = getFPLAtPercent(profile.householdSize, 215);

  // DC Healthcare Alliance: up to 200% FPL, includes undocumented
  // Source: https://dhcf.dc.gov/service/dc-healthcare-alliance
  const allianceLimit = getFPLAtPercent(profile.householdSize, 200);

  // Determine which program(s) apply
  const isUndocumented = profile.citizenshipStatus === 'undocumented';

  if (isUndocumented) {
    // DC Healthcare Alliance is available regardless of immigration status
    if (annualIncome <= allianceLimit) {
      reasoning.push(
        `Your income ($${annualIncome.toLocaleString()}/year) is within the DC Healthcare Alliance limit of $${allianceLimit.toLocaleString()} (200% FPL).`
      );
      reasoning.push('The DC Healthcare Alliance covers DC residents regardless of immigration status.');
      caveats.push('Alliance coverage requires recertification every 6 months.');

      return {
        programId: 'medicaid',
        programName: 'DC Healthcare Alliance',
        description: 'Health coverage for DC residents who do not qualify for Medicaid, including undocumented residents.',
        status: 'likely_eligible',
        reasoning,
        caveats,
        applyUrl: 'https://dchealthlink.com',
        applyInstructions: 'Apply through DC Health Link or visit a DHS service center.',
        sourceUrls: SOURCE_URLS,
      };
    } else {
      reasoning.push(
        `Your income ($${annualIncome.toLocaleString()}/year) exceeds the DC Healthcare Alliance limit of $${allianceLimit.toLocaleString()} (200% FPL).`
      );
      return {
        programId: 'medicaid',
        programName: 'DC Healthcare Alliance',
        description: 'Health coverage for DC residents who do not qualify for Medicaid, including undocumented residents.',
        status: 'likely_ineligible',
        reasoning,
        caveats: [],
        applyUrl: 'https://dchealthlink.com',
        applyInstructions: 'Apply through DC Health Link or visit a DHS service center.',
        sourceUrls: SOURCE_URLS,
      };
    }
  }

  // Non-undocumented — check Medicaid first
  let eligibleProgram = '';
  let limit = 0;

  if (profile.isPregnant === true) {
    limit = pregnantLimit;
    eligibleProgram = 'Medicaid (pregnant women)';
    reasoning.push(`As a pregnant DC resident, you may qualify for Medicaid with income up to $${limit.toLocaleString()}/year (319% FPL).`);
  } else if (hasChildren && annualIncome <= childLimit) {
    limit = childLimit;
    eligibleProgram = 'Medicaid / DC Healthy Families (children)';
    reasoning.push(`Your children may qualify for Medicaid/DC Healthy Families with household income up to $${limit.toLocaleString()}/year (319% FPL).`);
  } else {
    limit = adultLimit;
    eligibleProgram = 'Medicaid (adults)';
    reasoning.push(`As a DC adult, you may qualify for Medicaid with income up to $${limit.toLocaleString()}/year (215% FPL).`);
  }

  if (annualIncome <= limit) {
    reasoning.push(`Your income ($${annualIncome.toLocaleString()}/year) is within the ${eligibleProgram} income limit.`);

    return {
      programId: 'medicaid',
      programName: eligibleProgram,
      description: 'Free or low-cost health coverage for DC residents.',
      status: 'likely_eligible',
      reasoning,
      caveats,
      applyUrl: 'https://dchealthlink.com',
      applyInstructions: 'Apply through DC Health Link or visit a DHS service center.',
      sourceUrls: SOURCE_URLS,
    };
  }

  // Check Alliance as fallback for citizens/residents above Medicaid limits but below 200% FPL
  if (annualIncome <= allianceLimit) {
    reasoning.push(
      `Your income exceeds Medicaid limits but is within the DC Healthcare Alliance limit of $${allianceLimit.toLocaleString()} (200% FPL).`
    );
    caveats.push('Alliance coverage requires recertification every 6 months.');

    return {
      programId: 'medicaid',
      programName: 'DC Healthcare Alliance',
      description: 'Health coverage for DC residents who do not qualify for Medicaid.',
      status: 'may_be_eligible',
      reasoning,
      caveats,
      applyUrl: 'https://dchealthlink.com',
      applyInstructions: 'Apply through DC Health Link or visit a DHS service center.',
      sourceUrls: SOURCE_URLS,
    };
  }

  reasoning.push(
    `Your income ($${annualIncome.toLocaleString()}/year) exceeds both Medicaid and Alliance income limits for your household size.`
  );
  caveats.push('You may still qualify for subsidized coverage through DC Health Link marketplace.');

  return {
    programId: 'medicaid',
    programName: 'Medicaid / DC Healthcare Alliance',
    description: 'Free or low-cost health coverage for DC residents.',
    status: 'likely_ineligible',
    reasoning,
    caveats,
    applyUrl: 'https://dchealthlink.com',
    applyInstructions: 'Apply through DC Health Link or visit a DHS service center.',
    sourceUrls: SOURCE_URLS,
  };
}
