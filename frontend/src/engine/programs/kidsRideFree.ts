/**
 * Kids Ride Free — DC Eligibility Checker
 *
 * Source: https://kidsridefree.dc.gov
 */

import type { UserProfile, ProgramResult } from '../types';

const SOURCE_URLS = [
  'https://kidsridefree.dc.gov',
];

export function checkKidsRideFree(profile: UserProfile): ProgramResult {
  const reasoning: string[] = [];
  const caveats: string[] = [];

  if (!profile.isDCResident) {
    return makeResult('likely_ineligible', ['Kids Ride Free requires DC residency and enrollment in a DC school.'], []);
  }

  // Must have children ages 5-21 enrolled in DC schools
  const eligibleChildren = profile.childrenAges.filter(age => age >= 5 && age <= 21);

  if (eligibleChildren.length === 0) {
    // Check if they have children under 18 but didn't provide ages (use childrenUnder18 count)
    if (profile.childrenUnder18 > 0) {
      reasoning.push('Kids Ride Free is for DC students ages 5-21. Your children may be eligible if they are enrolled in a DC school.');
      return makeResult('may_be_eligible', reasoning, ['Children must be enrolled in a DC school and ages 5-21.']);
    }
    reasoning.push('Kids Ride Free is for DC students ages 5-21.');
    return makeResult('likely_ineligible', reasoning, []);
  }

  reasoning.push(
    `You have ${eligibleChildren.length} child${eligibleChildren.length > 1 ? 'ren' : ''} in the eligible age range (5-21) for Kids Ride Free.`
  );
  reasoning.push('Kids Ride Free provides free Metrobus and Metrorail rides during school hours.');

  caveats.push('Children must be enrolled in a DC school (public, public charter, or private).');
  caveats.push('A Kids Ride Free SmarTrip card must be obtained through the school.');

  return makeResult('likely_eligible', reasoning, caveats);
}

function makeResult(
  status: ProgramResult['status'],
  reasoning: string[],
  caveats: string[],
): ProgramResult {
  return {
    programId: 'kids_ride_free',
    programName: 'Kids Ride Free',
    description: 'Free Metrobus and Metrorail for DC students ages 5-21 during school hours.',
    status,
    reasoning,
    caveats,
    applyUrl: 'https://kidsridefree.dc.gov',
    applyInstructions: "Get a Kids Ride Free SmarTrip card through your child's school.",
    sourceUrls: SOURCE_URLS,
  };
}
