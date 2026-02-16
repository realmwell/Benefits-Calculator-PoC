import type { HouseholdInfo, IncomeInfo, CalculatorResult } from '../types';
import { getFPLPercentage } from '../data/thresholds';
import {
  checkSnap,
  checkMedicaid,
  checkChip,
  checkEitc,
  checkSection8,
  checkLiheap,
  checkWic,
  checkNslp,
} from './eligibility';

/**
 * Run all benefit eligibility checks and return a consolidated result.
 * Pure function — no side effects.
 */
export function calculateBenefits(
  household: HouseholdInfo,
  income: IncomeInfo,
): CalculatorResult {
  const results = [
    checkSnap(household, income),
    checkMedicaid(household, income),
    checkChip(household, income),
    checkEitc(household, income),
    checkSection8(household, income),
    checkLiheap(household, income),
    checkWic(household, income),
    checkNslp(household, income),
  ];

  const totalMonthly = results.reduce(
    (sum, r) => sum + (r.eligible && r.estimatedMonthlyBenefit ? r.estimatedMonthlyBenefit : 0),
    0,
  );

  const totalAnnual = results.reduce(
    (sum, r) => sum + (r.eligible && r.estimatedAnnualBenefit ? r.estimatedAnnualBenefit : 0),
    0,
  );

  const annualIncome = income.grossMonthlyIncome * 12;
  const householdFplPercentage = getFPLPercentage(annualIncome, household.householdSize);

  return {
    results,
    totalEstimatedMonthlyBenefits: totalMonthly,
    totalEstimatedAnnualBenefits: totalAnnual,
    householdFplPercentage,
  };
}
