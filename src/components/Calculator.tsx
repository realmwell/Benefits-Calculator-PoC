import { useState } from 'react';
import type { HouseholdInfo, IncomeInfo, CalculatorResult, FormStep } from '../types';
import { calculateBenefits } from '../engine/benefits';
import HouseholdForm from './HouseholdForm';
import IncomeForm from './IncomeForm';
import ResultsDisplay from './ResultsDisplay';

const defaultHousehold: HouseholdInfo = {
  householdSize: 1,
  childrenUnder18: 0,
  childrenUnder6: 0,
  hasPregnant: false,
  hasElderly: false,
  hasDisabled: false,
  state: 'US',
};

const defaultIncome: IncomeInfo = {
  grossMonthlyIncome: 0,
  netMonthlyIncome: undefined,
  annualEarnedIncome: 0,
  filingStatus: 'single',
  hasHighInvestmentIncome: false,
};

export default function Calculator() {
  const [step, setStep] = useState<FormStep>('household');
  const [household, setHousehold] = useState<HouseholdInfo>(defaultHousehold);
  const [income, setIncome] = useState<IncomeInfo>(defaultIncome);
  const [result, setResult] = useState<CalculatorResult | null>(null);

  function goToIncome() {
    setStep('income');
  }

  function goToHousehold() {
    setStep('household');
  }

  function calculate() {
    const r = calculateBenefits(household, income);
    setResult(r);
    setStep('results');
  }

  function startOver() {
    setHousehold(defaultHousehold);
    setIncome(defaultIncome);
    setResult(null);
    setStep('household');
  }

  const stepIndex = step === 'household' ? 0 : step === 'income' ? 1 : 2;

  return (
    <div className="calculator">
      <header className="calc-header">
        <h1>Benefits Calculator</h1>
        <p className="subtitle">Estimate your eligibility for U.S. assistance programs</p>
      </header>

      <div className="progress-bar">
        {['Household', 'Income', 'Results'].map((label, i) => (
          <div
            key={label}
            className={`progress-step ${i <= stepIndex ? 'active' : ''} ${i < stepIndex ? 'completed' : ''}`}
          >
            <div className="step-dot">{i < stepIndex ? '\u2713' : i + 1}</div>
            <span className="step-label">{label}</span>
          </div>
        ))}
      </div>

      <main className="calc-body">
        {step === 'household' && (
          <HouseholdForm data={household} onChange={setHousehold} onNext={goToIncome} />
        )}
        {step === 'income' && (
          <IncomeForm
            data={income}
            onChange={setIncome}
            onNext={calculate}
            onBack={goToHousehold}
          />
        )}
        {step === 'results' && result && (
          <ResultsDisplay result={result} onStartOver={startOver} />
        )}
      </main>
    </div>
  );
}
