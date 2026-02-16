/**
 * DC Benefits Finder — Eligibility Engine Tests
 *
 * Test scenarios from the spec:
 * 1. Single adult, recently laid off, renting, no kids
 * 2. Single parent, 2 kids (3 and 7), part-time, low income
 * 3. Senior couple (both 68), fixed income, own home
 * 4. Undocumented resident, working, low income
 */

import { evaluateEligibility } from '../../frontend/src/engine/eligibility';
import type { UserProfile } from '../../frontend/src/engine/types';

// ── Test Helpers ─────────────────────────────────────────────────────

function makeProfile(overrides: Partial<UserProfile>): UserProfile {
  return {
    age: 35,
    isDCResident: true,
    citizenshipStatus: 'us_citizen',
    isPregnant: false,
    hasDisability: false,
    isVeteran: false,
    householdSize: 1,
    childrenUnder18: 0,
    childrenAges: [],
    adultsOver65: 0,
    relationshipStatus: 'single',
    isBreastfeeding: false,
    employmentStatus: 'employed_full',
    worksForDCEmployer: true,
    lostJobRecently: false,
    lostJobNoFault: false,
    grossMonthlyIncome: 3000,
    earnedMonthlyIncome: 3000,
    annualIncome: 36000,
    housingSituation: 'rent',
    monthlyRent: 1200,
    hasHomesteadDeduction: null,
    monthlyUtilities: 100,
    paysChildCare: false,
    monthlyChildCare: 0,
    monthlyMedicalExpenses: 0,
    currentBenefits: [],
    ...overrides,
  };
}

function findProgram(results: ReturnType<typeof evaluateEligibility>, id: string) {
  return (
    results.likelyEligible.find(r => r.programId === id) ||
    results.mayBeEligible.find(r => r.programId === id) ||
    results.likelyIneligible.find(r => r.programId === id)
  );
}

// ── Persona 1: Single adult, recently laid off ───────────────────────

const persona1 = makeProfile({
  age: 30,
  employmentStatus: 'unemployed_looking',
  worksForDCEmployer: false,
  lostJobRecently: true,
  lostJobNoFault: true,
  grossMonthlyIncome: 0,
  earnedMonthlyIncome: 0,
  annualIncome: 0,
  monthlyRent: 1400,
  monthlyUtilities: 150,
});

const results1 = evaluateEligibility(persona1);

// Should qualify for: unemployment, SNAP, Medicaid, LIHEAP, EITC (no — no earned income)
console.log('=== Persona 1: Single adult, recently laid off ===');
console.log('Likely eligible:', results1.likelyEligible.map(r => r.programId));
console.log('May be eligible:', results1.mayBeEligible.map(r => r.programId));

const p1snap = findProgram(results1, 'snap');
console.assert(p1snap?.status === 'likely_eligible', 'Persona 1 should be SNAP eligible');

const p1medicaid = findProgram(results1, 'medicaid');
console.assert(
  p1medicaid?.status === 'likely_eligible',
  'Persona 1 should be Medicaid eligible',
);

const p1ui = findProgram(results1, 'unemployment');
console.assert(
  p1ui?.status === 'likely_eligible',
  'Persona 1 should be UI eligible',
);

const p1liheap = findProgram(results1, 'liheap');
console.assert(
  p1liheap?.status === 'likely_eligible',
  'Persona 1 should be LIHEAP eligible',
);

// ── Persona 2: Single parent, 2 kids, part-time, low income ─────────

const persona2 = makeProfile({
  age: 28,
  householdSize: 3,
  childrenUnder18: 2,
  childrenAges: [3, 7],
  employmentStatus: 'employed_part',
  worksForDCEmployer: true,
  grossMonthlyIncome: 1800,
  earnedMonthlyIncome: 1800,
  annualIncome: 21600,
  monthlyRent: 1000,
  monthlyUtilities: 120,
  paysChildCare: true,
  monthlyChildCare: 400,
});

const results2 = evaluateEligibility(persona2);

console.log('\n=== Persona 2: Single parent, 2 kids, part-time ===');
console.log('Likely eligible:', results2.likelyEligible.map(r => r.programId));
console.log('May be eligible:', results2.mayBeEligible.map(r => r.programId));

const p2snap = findProgram(results2, 'snap');
console.assert(p2snap?.status === 'likely_eligible', 'Persona 2 should be SNAP eligible');

const p2medicaid = findProgram(results2, 'medicaid');
console.assert(
  p2medicaid?.status === 'likely_eligible',
  'Persona 2 should be Medicaid eligible',
);

const p2tanf = findProgram(results2, 'tanf');
// TANF income limits are very low ($751/mo for HH size 3). At $1,800/mo, Persona 2 exceeds them.
console.assert(
  p2tanf?.status === 'likely_ineligible',
  'Persona 2 income exceeds TANF limits',
);

const p2wic = findProgram(results2, 'wic');
console.assert(
  p2wic?.status === 'likely_eligible',
  'Persona 2 should be WIC eligible (child under 5)',
);

const p2eitc = findProgram(results2, 'dc_eitc');
console.assert(
  p2eitc?.status === 'likely_eligible',
  'Persona 2 should be EITC eligible',
);

const p2meals = findProgram(results2, 'school_meals');
console.assert(
  p2meals?.status === 'likely_eligible' || p2meals?.status === 'may_be_eligible',
  'Persona 2 should qualify for school meals',
);

const p2krf = findProgram(results2, 'kids_ride_free');
console.assert(
  p2krf?.status === 'likely_eligible' || p2krf?.status === 'may_be_eligible',
  'Persona 2 kids should qualify for Kids Ride Free',
);

// ── Persona 3: Senior couple, fixed income, own home ─────────────────

const persona3 = makeProfile({
  age: 68,
  householdSize: 2,
  adultsOver65: 2,
  relationshipStatus: 'married',
  employmentStatus: 'retired',
  worksForDCEmployer: false,
  grossMonthlyIncome: 2200,
  earnedMonthlyIncome: 0,
  annualIncome: 26400,
  housingSituation: 'own',
  monthlyRent: 0,
  hasHomesteadDeduction: false,
  monthlyUtilities: 200,
  monthlyMedicalExpenses: 150,
});

const results3 = evaluateEligibility(persona3);

console.log('\n=== Persona 3: Senior couple, own home ===');
console.log('Likely eligible:', results3.likelyEligible.map(r => r.programId));
console.log('May be eligible:', results3.mayBeEligible.map(r => r.programId));

const p3propertyTax = findProgram(results3, 'property_tax');
console.assert(
  p3propertyTax?.status === 'likely_eligible',
  'Persona 3 should qualify for property tax relief',
);

const p3snap = findProgram(results3, 'snap');
console.assert(
  p3snap?.status === 'likely_eligible' || p3snap?.status === 'may_be_eligible',
  'Persona 3 should qualify for SNAP',
);

const p3liheap = findProgram(results3, 'liheap');
console.assert(
  p3liheap?.status === 'likely_eligible',
  'Persona 3 should qualify for LIHEAP',
);

// ── Persona 4: Undocumented resident, working, low income ────────────

const persona4 = makeProfile({
  age: 35,
  citizenshipStatus: 'undocumented',
  householdSize: 3,
  childrenUnder18: 1,
  childrenAges: [4],
  employmentStatus: 'employed_full',
  worksForDCEmployer: true,
  grossMonthlyIncome: 2000,
  earnedMonthlyIncome: 2000,
  annualIncome: 24000,
  monthlyRent: 1100,
  monthlyUtilities: 100,
  isPregnant: true,
});

const results4 = evaluateEligibility(persona4);

console.log('\n=== Persona 4: Undocumented, working, low income ===');
console.log('Likely eligible:', results4.likelyEligible.map(r => r.programId));
console.log('May be eligible:', results4.mayBeEligible.map(r => r.programId));

const p4alliance = findProgram(results4, 'medicaid');
console.assert(
  p4alliance?.status === 'likely_eligible',
  'Persona 4 should qualify for DC Healthcare Alliance',
);

const p4wic = findProgram(results4, 'wic');
console.assert(
  p4wic?.status === 'likely_eligible',
  'Persona 4 should qualify for WIC (pregnant + child under 5)',
);

const p4eitc = findProgram(results4, 'dc_eitc');
console.assert(
  p4eitc?.status === 'likely_eligible',
  'Persona 4 should qualify for DC EITC (ITIN holders eligible)',
);

const p4meals = findProgram(results4, 'school_meals');
// Child is 4, may not be school-age yet, but school_meals checker handles this

console.log('\n=== All persona tests completed ===');
