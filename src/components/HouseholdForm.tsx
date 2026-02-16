import type { HouseholdInfo } from '../types';

interface Props {
  data: HouseholdInfo;
  onChange: (data: HouseholdInfo) => void;
  onNext: () => void;
}

export default function HouseholdForm({ data, onChange, onNext }: Props) {
  function update(patch: Partial<HouseholdInfo>) {
    onChange({ ...data, ...patch });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNext();
  }

  return (
    <form className="form-step" onSubmit={handleSubmit}>
      <h2>Household Information</h2>
      <p className="form-description">
        Tell us about your household so we can check benefit eligibility.
      </p>

      <label className="field">
        <span className="field-label">Household size (including yourself)</span>
        <input
          type="number"
          min={1}
          max={20}
          value={data.householdSize}
          onChange={(e) => update({ householdSize: Math.max(1, +e.target.value) })}
          required
        />
      </label>

      <label className="field">
        <span className="field-label">Children under 18</span>
        <input
          type="number"
          min={0}
          max={data.householdSize - 1}
          value={data.childrenUnder18}
          onChange={(e) => update({ childrenUnder18: Math.max(0, +e.target.value) })}
        />
      </label>

      <label className="field">
        <span className="field-label">Children under 6</span>
        <input
          type="number"
          min={0}
          max={data.childrenUnder18}
          value={data.childrenUnder6}
          onChange={(e) => update({ childrenUnder6: Math.max(0, +e.target.value) })}
        />
      </label>

      <fieldset className="checkbox-group">
        <legend>Household members (check all that apply)</legend>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={data.hasPregnant}
            onChange={(e) => update({ hasPregnant: e.target.checked })}
          />
          <span>Someone is pregnant</span>
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={data.hasElderly}
            onChange={(e) => update({ hasElderly: e.target.checked })}
          />
          <span>Someone is 65 or older</span>
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={data.hasDisabled}
            onChange={(e) => update({ hasDisabled: e.target.checked })}
          />
          <span>Someone has a disability</span>
        </label>
      </fieldset>

      <button type="submit" className="btn btn-primary">
        Next: Income Details
      </button>
    </form>
  );
}
