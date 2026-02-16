import type { HouseholdInfo, IncomeInfo, EligibilityResult } from '../types';
import {
  getFPLPercentage,
  SNAP_GROSS_INCOME_LIMIT_PCT,
  SNAP_NET_INCOME_LIMIT_PCT,
  SNAP_MAX_ALLOTMENT,
  SNAP_ADDITIONAL_PERSON,
  MEDICAID_EXPANSION_LIMIT_PCT,
  CHIP_INCOME_LIMIT_PCT,
  SECTION8_INCOME_LIMIT_PCT,
  LIHEAP_INCOME_LIMIT_PCT,
  WIC_INCOME_LIMIT_PCT,
  NSLP_FREE_LIMIT_PCT,
  NSLP_REDUCED_LIMIT_PCT,
  EITC_2024,
} from '../data/thresholds';

function getNetMonthly(income: IncomeInfo): number {
  return income.netMonthlyIncome ?? Math.round(income.grossMonthlyIncome * 0.8);
}

function annualFromMonthly(monthly: number): number {
  return monthly * 12;
}

/** SNAP eligibility */
export function checkSnap(
  household: HouseholdInfo,
  income: IncomeInfo,
): EligibilityResult {
  const grossAnnual = annualFromMonthly(income.grossMonthlyIncome);
  const netAnnual = annualFromMonthly(getNetMonthly(income));
  const grossPct = getFPLPercentage(grossAnnual, household.householdSize);
  const netPct = getFPLPercentage(netAnnual, household.householdSize);

  const grossOk = grossPct <= SNAP_GROSS_INCOME_LIMIT_PCT || household.hasElderly || household.hasDisabled;
  const netOk = netPct <= SNAP_NET_INCOME_LIMIT_PCT;

  const eligible = grossOk && netOk;

  let monthlyBenefit: number | null = null;
  if (eligible) {
    const size = household.householdSize;
    const maxAllotment = size <= 8
      ? (SNAP_MAX_ALLOTMENT[size] ?? SNAP_MAX_ALLOTMENT[1])
      : SNAP_MAX_ALLOTMENT[8] + (size - 8) * SNAP_ADDITIONAL_PERSON;
    const expectedContribution = Math.round(getNetMonthly(income) * 0.3);
    monthlyBenefit = Math.max(0, maxAllotment - expectedContribution);
  }

  let reason: string;
  if (eligible) {
    reason = `Gross income is ${grossPct.toFixed(0)}% of FPL (limit: ${SNAP_GROSS_INCOME_LIMIT_PCT}%). Net income is ${netPct.toFixed(0)}% of FPL (limit: ${SNAP_NET_INCOME_LIMIT_PCT}%).`;
  } else if (!grossOk) {
    reason = `Gross income (${grossPct.toFixed(0)}% FPL) exceeds the ${SNAP_GROSS_INCOME_LIMIT_PCT}% limit.`;
  } else {
    reason = `Net income (${netPct.toFixed(0)}% FPL) exceeds the ${SNAP_NET_INCOME_LIMIT_PCT}% limit.`;
  }

  return {
    program: 'snap',
    programName: 'SNAP (Food Stamps)',
    eligible,
    estimatedMonthlyBenefit: monthlyBenefit,
    estimatedAnnualBenefit: monthlyBenefit !== null ? monthlyBenefit * 12 : null,
    reason,
    fplPercentage: grossPct,
  };
}

/** Medicaid eligibility (ACA expansion model) */
export function checkMedicaid(
  household: HouseholdInfo,
  income: IncomeInfo,
): EligibilityResult {
  const annualIncome = annualFromMonthly(income.grossMonthlyIncome);
  const pct = getFPLPercentage(annualIncome, household.householdSize);
  const eligible = pct <= MEDICAID_EXPANSION_LIMIT_PCT;

  return {
    program: 'medicaid',
    programName: 'Medicaid',
    eligible,
    estimatedMonthlyBenefit: null,
    estimatedAnnualBenefit: null,
    reason: eligible
      ? `Income is ${pct.toFixed(0)}% of FPL (limit: ${MEDICAID_EXPANSION_LIMIT_PCT}%). Medicaid covers most healthcare costs.`
      : `Income (${pct.toFixed(0)}% FPL) exceeds the ${MEDICAID_EXPANSION_LIMIT_PCT}% Medicaid expansion limit.`,
    fplPercentage: pct,
  };
}

/** CHIP eligibility */
export function checkChip(
  household: HouseholdInfo,
  income: IncomeInfo,
): EligibilityResult {
  const annualIncome = annualFromMonthly(income.grossMonthlyIncome);
  const pct = getFPLPercentage(annualIncome, household.householdSize);
  const hasChildren = household.childrenUnder18 > 0;
  const eligible = hasChildren && pct <= CHIP_INCOME_LIMIT_PCT && pct > MEDICAID_EXPANSION_LIMIT_PCT;

  let reason: string;
  if (!hasChildren) {
    reason = 'No children under 18 in household.';
  } else if (pct <= MEDICAID_EXPANSION_LIMIT_PCT) {
    reason = `Children may qualify for Medicaid instead (income is ${pct.toFixed(0)}% FPL).`;
  } else if (eligible) {
    reason = `Income is ${pct.toFixed(0)}% of FPL. Children may qualify for CHIP (limit: ${CHIP_INCOME_LIMIT_PCT}% FPL).`;
  } else {
    reason = `Income (${pct.toFixed(0)}% FPL) exceeds the ${CHIP_INCOME_LIMIT_PCT}% CHIP limit.`;
  }

  return {
    program: 'chip',
    programName: 'CHIP (Children\'s Health Insurance)',
    eligible,
    estimatedMonthlyBenefit: null,
    estimatedAnnualBenefit: null,
    reason,
    fplPercentage: pct,
  };
}

/** EITC eligibility */
export function checkEitc(
  household: HouseholdInfo,
  income: IncomeInfo,
): EligibilityResult {
  const annualIncome = annualFromMonthly(income.grossMonthlyIncome);
  const pct = getFPLPercentage(annualIncome, household.householdSize);
  const qualifyingChildren = Math.min(household.childrenUnder18, 3);
  const eitcBracket = EITC_2024[qualifyingChildren] ?? EITC_2024[0];

  const incomeLimit = income.filingStatus === 'married'
    ? eitcBracket.marriedLimit
    : eitcBracket.singleLimit;

  const eligible = income.annualEarnedIncome > 0
    && income.annualEarnedIncome <= incomeLimit
    && !income.hasHighInvestmentIncome;

  let annualBenefit: number | null = null;
  if (eligible) {
    const ratio = 1 - (income.annualEarnedIncome / incomeLimit);
    annualBenefit = Math.round(eitcBracket.maxCredit * Math.max(0, ratio));
  }

  return {
    program: 'eitc',
    programName: 'Earned Income Tax Credit (EITC)',
    eligible,
    estimatedMonthlyBenefit: annualBenefit !== null ? Math.round(annualBenefit / 12) : null,
    estimatedAnnualBenefit: annualBenefit,
    reason: eligible
      ? `With ${qualifyingChildren} qualifying child(ren) and earned income of $${income.annualEarnedIncome.toLocaleString()}, you may qualify for up to $${eitcBracket.maxCredit.toLocaleString()}/year.`
      : income.annualEarnedIncome === 0
        ? 'EITC requires earned income (wages, salary, or self-employment).'
        : `Earned income ($${income.annualEarnedIncome.toLocaleString()}) exceeds the $${incomeLimit.toLocaleString()} limit for ${qualifyingChildren} child(ren).`,
    fplPercentage: pct,
  };
}

/** Section 8 Housing Choice Voucher eligibility */
export function checkSection8(
  household: HouseholdInfo,
  income: IncomeInfo,
): EligibilityResult {
  const annualIncome = annualFromMonthly(income.grossMonthlyIncome);
  const pct = getFPLPercentage(annualIncome, household.householdSize);
  const eligible = pct <= SECTION8_INCOME_LIMIT_PCT;

  return {
    program: 'section8',
    programName: 'Housing Choice Voucher (Section 8)',
    eligible,
    estimatedMonthlyBenefit: null,
    estimatedAnnualBenefit: null,
    reason: eligible
      ? `Income is ${pct.toFixed(0)}% of FPL (limit: ~${SECTION8_INCOME_LIMIT_PCT}%). Voucher amount depends on local fair market rent.`
      : `Income (${pct.toFixed(0)}% FPL) likely exceeds the ~${SECTION8_INCOME_LIMIT_PCT}% limit. Section 8 uses area median income which varies by location.`,
    fplPercentage: pct,
  };
}

/** LIHEAP eligibility */
export function checkLiheap(
  household: HouseholdInfo,
  income: IncomeInfo,
): EligibilityResult {
  const annualIncome = annualFromMonthly(income.grossMonthlyIncome);
  const pct = getFPLPercentage(annualIncome, household.householdSize);
  const eligible = pct <= LIHEAP_INCOME_LIMIT_PCT;

  const estimatedAnnual = eligible ? Math.round(400 + (household.householdSize - 1) * 50) : null;

  return {
    program: 'liheap',
    programName: 'LIHEAP (Energy Assistance)',
    eligible,
    estimatedMonthlyBenefit: estimatedAnnual !== null ? Math.round(estimatedAnnual / 12) : null,
    estimatedAnnualBenefit: estimatedAnnual,
    reason: eligible
      ? `Income is ${pct.toFixed(0)}% of FPL (limit: ${LIHEAP_INCOME_LIMIT_PCT}%). Benefit varies by state and energy costs.`
      : `Income (${pct.toFixed(0)}% FPL) exceeds the ${LIHEAP_INCOME_LIMIT_PCT}% LIHEAP limit.`,
    fplPercentage: pct,
  };
}

/** WIC eligibility */
export function checkWic(
  household: HouseholdInfo,
  income: IncomeInfo,
): EligibilityResult {
  const annualIncome = annualFromMonthly(income.grossMonthlyIncome);
  const pct = getFPLPercentage(annualIncome, household.householdSize);
  const hasEligibleMembers = household.hasPregnant || household.childrenUnder6 > 0;
  const eligible = hasEligibleMembers && pct <= WIC_INCOME_LIMIT_PCT;

  let reason: string;
  if (!hasEligibleMembers) {
    reason = 'WIC requires pregnant individuals, infants, or children under 5 in the household.';
  } else if (eligible) {
    reason = `Income is ${pct.toFixed(0)}% of FPL (limit: ${WIC_INCOME_LIMIT_PCT}%). Household has qualifying members.`;
  } else {
    reason = `Income (${pct.toFixed(0)}% FPL) exceeds the ${WIC_INCOME_LIMIT_PCT}% WIC limit.`;
  }

  return {
    program: 'wic',
    programName: 'WIC (Women, Infants & Children)',
    eligible,
    estimatedMonthlyBenefit: eligible ? 75 : null,
    estimatedAnnualBenefit: eligible ? 900 : null,
    reason,
    fplPercentage: pct,
  };
}

/** NSLP (Free/Reduced School Lunch) eligibility */
export function checkNslp(
  household: HouseholdInfo,
  income: IncomeInfo,
): EligibilityResult {
  const annualIncome = annualFromMonthly(income.grossMonthlyIncome);
  const pct = getFPLPercentage(annualIncome, household.householdSize);
  const hasSchoolChildren = household.childrenUnder18 > 0;
  const freeLunch = pct <= NSLP_FREE_LIMIT_PCT;
  const reducedLunch = pct <= NSLP_REDUCED_LIMIT_PCT;
  const eligible = hasSchoolChildren && (freeLunch || reducedLunch);

  const monthlySavings = freeLunch ? 150 : reducedLunch ? 100 : null;

  let reason: string;
  if (!hasSchoolChildren) {
    reason = 'No school-age children in household.';
  } else if (freeLunch) {
    reason = `Income is ${pct.toFixed(0)}% of FPL (under ${NSLP_FREE_LIMIT_PCT}%). Children qualify for FREE lunch.`;
  } else if (reducedLunch) {
    reason = `Income is ${pct.toFixed(0)}% of FPL (under ${NSLP_REDUCED_LIMIT_PCT}%). Children qualify for REDUCED-PRICE lunch.`;
  } else {
    reason = `Income (${pct.toFixed(0)}% FPL) exceeds the ${NSLP_REDUCED_LIMIT_PCT}% limit for reduced-price lunch.`;
  }

  return {
    program: 'nslp',
    programName: freeLunch ? 'Free School Lunch' : 'Reduced-Price School Lunch',
    eligible,
    estimatedMonthlyBenefit: monthlySavings,
    estimatedAnnualBenefit: monthlySavings !== null ? monthlySavings * 10 : null,
    reason,
    fplPercentage: pct,
  };
}
