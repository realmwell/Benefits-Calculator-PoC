/**
 * Interim Disability Assistance (IDA) — DC Eligibility Checker
 *
 * Source: https://dhs.dc.gov/service/interim-disability-assistance
 */

import type { UserProfile, ProgramResult } from '../types';

const SOURCE_URLS = [
  'https://dhs.dc.gov/service/interim-disability-assistance',
];

export function checkIDA(profile: UserProfile): ProgramResult {
  const reasoning: string[] = [];
  const caveats: string[] = [];

  if (!profile.isDCResident) {
    return makeResult('likely_ineligible', ['IDA requires DC residency.'], []);
  }

  // Must have a disability that prevents work
  if (!profile.hasDisability) {
    reasoning.push('IDA is for DC residents who are unable to work due to a disability and are awaiting an SSI determination.');
    return makeResult('likely_ineligible', reasoning, []);
  }

  // Should not already be receiving SSI
  if (profile.currentBenefits.includes('ssi_ssdi')) {
    reasoning.push('IDA is temporary assistance while your SSI application is pending. Since you already receive SSI/SSDI, IDA would not apply.');
    return makeResult('likely_ineligible', reasoning, []);
  }

  reasoning.push('You reported a disability that limits your ability to work.');
  reasoning.push('IDA provides temporary cash assistance while your SSI application is pending.');

  // Citizenship
  if (profile.citizenshipStatus === 'undocumented') {
    reasoning.push('IDA generally requires U.S. citizenship or qualified immigration status.');
    return makeResult('likely_ineligible', reasoning, []);
  }

  // Employment check
  if (profile.employmentStatus === 'unable_to_work') {
    reasoning.push('You indicated you are unable to work, which aligns with IDA eligibility.');
  } else {
    caveats.push('IDA requires that your disability prevents you from working. Your current employment status may affect eligibility.');
  }

  caveats.push('You must have a high probability of receiving SSI to qualify for IDA.');
  caveats.push('IDA benefits are temporary and will be repaid from your SSI back payment if approved.');

  return makeResult('may_be_eligible', reasoning, caveats);
}

function makeResult(
  status: ProgramResult['status'],
  reasoning: string[],
  caveats: string[],
): ProgramResult {
  return {
    programId: 'ida',
    programName: 'Interim Disability Assistance (IDA)',
    description: 'Temporary cash assistance for DC residents with disabilities while awaiting SSI approval.',
    status,
    reasoning,
    caveats,
    applyUrl: 'https://dhs.dc.gov/service/interim-disability-assistance',
    applyInstructions: 'Apply through DC DHS. You will need medical documentation of your disability.',
    sourceUrls: SOURCE_URLS,
  };
}
