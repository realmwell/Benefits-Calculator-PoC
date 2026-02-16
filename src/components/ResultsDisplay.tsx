import type { CalculatorResult } from '../types';
import { formatCurrency, formatPercent } from '../utils/format';

interface Props {
  result: CalculatorResult;
  onStartOver: () => void;
}

export default function ResultsDisplay({ result, onStartOver }: Props) {
  const eligible = result.results.filter((r) => r.eligible);
  const ineligible = result.results.filter((r) => !r.eligible);

  return (
    <div className="results">
      <h2>Your Benefits Estimate</h2>

      <div className="summary-card">
        <div className="summary-stat">
          <span className="stat-label">Household Income</span>
          <span className="stat-value">{formatPercent(result.householdFplPercentage)} of FPL</span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Programs You May Qualify For</span>
          <span className="stat-value highlight">{eligible.length} of {result.results.length}</span>
        </div>
        {result.totalEstimatedMonthlyBenefits > 0 && (
          <div className="summary-stat">
            <span className="stat-label">Estimated Monthly Benefits</span>
            <span className="stat-value highlight">
              {formatCurrency(result.totalEstimatedMonthlyBenefits)}
            </span>
          </div>
        )}
        {result.totalEstimatedAnnualBenefits > 0 && (
          <div className="summary-stat">
            <span className="stat-label">Estimated Annual Benefits</span>
            <span className="stat-value">
              {formatCurrency(result.totalEstimatedAnnualBenefits)}
            </span>
          </div>
        )}
      </div>

      {eligible.length > 0 && (
        <section className="result-section">
          <h3>Likely Eligible</h3>
          {eligible.map((r) => (
            <div key={r.program} className="result-card eligible">
              <div className="result-header">
                <span className="program-name">{r.programName}</span>
                {r.estimatedMonthlyBenefit !== null && (
                  <span className="benefit-amount">
                    ~{formatCurrency(r.estimatedMonthlyBenefit)}/mo
                  </span>
                )}
              </div>
              <p className="result-reason">{r.reason}</p>
            </div>
          ))}
        </section>
      )}

      {ineligible.length > 0 && (
        <section className="result-section">
          <h3>Likely Not Eligible</h3>
          {ineligible.map((r) => (
            <div key={r.program} className="result-card ineligible">
              <div className="result-header">
                <span className="program-name">{r.programName}</span>
              </div>
              <p className="result-reason">{r.reason}</p>
            </div>
          ))}
        </section>
      )}

      <p className="disclaimer">
        These are estimates only. Actual eligibility is determined by the relevant
        federal, state, or local agency. Contact your local benefits office for
        official determinations.
      </p>

      <button className="btn btn-primary" onClick={onStartOver}>
        Start Over
      </button>
    </div>
  );
}
