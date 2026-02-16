import type { IncomeInfo, FilingStatus } from '../types';

interface Props {
  data: IncomeInfo;
  onChange: (data: IncomeInfo) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function IncomeForm({ data, onChange, onNext, onBack }: Props) {
  function update(patch: Partial<IncomeInfo>) {
    onChange({ ...data, ...patch });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNext();
  }

  return (
    <form className="form-step" onSubmit={handleSubmit}>
      <h2>Income Information</h2>
      <p className="form-description">
        Enter your household income details. All amounts should be in U.S. dollars.
      </p>

      <label className="field">
        <span className="field-label">Gross monthly income (before taxes)</span>
        <div className="input-prefix">
          <span className="prefix">$</span>
          <input
            type="number"
            min={0}
            step={1}
            value={data.grossMonthlyIncome || ''}
            placeholder="0"
            onChange={(e) => update({ grossMonthlyIncome: Math.max(0, +e.target.value) })}
            required
          />
        </div>
      </label>

      <label className="field">
        <span className="field-label">Net monthly income (after deductions) — optional</span>
        <div className="input-prefix">
          <span className="prefix">$</span>
          <input
            type="number"
            min={0}
            step={1}
            value={data.netMonthlyIncome ?? ''}
            placeholder="Auto-estimated if blank"
            onChange={(e) => {
              const val = e.target.value;
              update({ netMonthlyIncome: val === '' ? undefined : Math.max(0, +val) });
            }}
          />
        </div>
      </label>

      <label className="field">
        <span className="field-label">Annual earned income (wages, salary, self-employment)</span>
        <div className="input-prefix">
          <span className="prefix">$</span>
          <input
            type="number"
            min={0}
            step={1}
            value={data.annualEarnedIncome || ''}
            placeholder="0"
            onChange={(e) => update({ annualEarnedIncome: Math.max(0, +e.target.value) })}
            required
          />
        </div>
      </label>

      <label className="field">
        <span className="field-label">Tax filing status</span>
        <select
          value={data.filingStatus}
          onChange={(e) => update({ filingStatus: e.target.value as FilingStatus })}
        >
          <option value="single">Single</option>
          <option value="married">Married filing jointly</option>
          <option value="head_of_household">Head of household</option>
        </select>
      </label>

      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={data.hasHighInvestmentIncome}
          onChange={(e) => update({ hasHighInvestmentIncome: e.target.checked })}
        />
        <span>Investment income exceeds $10,000/year</span>
      </label>

      <div className="btn-row">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <button type="submit" className="btn btn-primary">
          Calculate Benefits
        </button>
      </div>
    </form>
  );
}
