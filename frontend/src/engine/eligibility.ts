/**
 * DC Benefits Finder — Eligibility Engine Orchestrator
 *
 * Runs all program checkers against a user profile and returns grouped results.
 * All logic is deterministic and runs client-side.
 */

import type { UserProfile, ProgramResult, EligibilityStatus } from './types';
import { checkSNAP } from './programs/snap';
import { checkMedicaid } from './programs/medicaid';
import { checkTANF } from './programs/tanf';
import { checkEITC } from './programs/eitc';
import { checkPaidFamilyLeave } from './programs/paidFamilyLeave';
import { checkUnemployment } from './programs/unemployment';
import { checkLIHEAP } from './programs/liheap';
import { checkWIC } from './programs/wic';
import { checkChildCareSubsidy } from './programs/childCareSubsidy';
import { checkPropertyTax } from './programs/propertyTax';
import { checkSSI } from './programs/ssi';
import { checkIDA } from './programs/ida';
import { checkSchoolMeals } from './programs/schoolMeals';
import { checkKidsRideFree } from './programs/kidsRideFree';

/**
 * All program checkers in evaluation order.
 */
const ALL_CHECKERS = [
  checkSNAP,
  checkMedicaid,
  checkTANF,
  checkEITC,
  checkPaidFamilyLeave,
  checkUnemployment,
  checkLIHEAP,
  checkWIC,
  checkChildCareSubsidy,
  checkPropertyTax,
  checkSSI,
  checkIDA,
  checkSchoolMeals,
  checkKidsRideFree,
];

export interface EligibilityResults {
  likelyEligible: ProgramResult[];
  mayBeEligible: ProgramResult[];
  likelyIneligible: ProgramResult[];
  totalEstimatedAnnual: number;
  totalEstimatedMonthly: number;
}

/**
 * Run all program eligibility checks against a user profile.
 */
export function evaluateEligibility(profile: UserProfile): EligibilityResults {
  const results = ALL_CHECKERS.map(checker => checker(profile));

  const grouped: Record<EligibilityStatus, ProgramResult[]> = {
    likely_eligible: [],
    may_be_eligible: [],
    likely_ineligible: [],
  };

  for (const result of results) {
    grouped[result.status].push(result);
  }

  // Calculate total estimated benefits
  let totalAnnual = 0;
  let totalMonthly = 0;

  for (const result of [...grouped.likely_eligible, ...grouped.may_be_eligible]) {
    if (result.estimatedBenefit) {
      if (result.estimatedBenefit.annual) {
        totalAnnual += result.estimatedBenefit.annual;
      }
      if (result.estimatedBenefit.monthly) {
        totalMonthly += result.estimatedBenefit.monthly;
      } else if (result.estimatedBenefit.weekly) {
        totalMonthly += Math.round(result.estimatedBenefit.weekly * 4.33);
      }
    }
  }

  // If we have monthly but not annual, estimate annual
  if (totalMonthly > 0 && totalAnnual === 0) {
    totalAnnual = totalMonthly * 12;
  }

  return {
    likelyEligible: grouped.likely_eligible,
    mayBeEligible: grouped.may_be_eligible,
    likelyIneligible: grouped.likely_ineligible,
    totalEstimatedAnnual: totalAnnual,
    totalEstimatedMonthly: totalMonthly,
  };
}
