import { useLocation, useNavigate } from 'react-router-dom';
import type { UserProfile } from '../../engine/types';
import { Layout } from '../shared/Layout';

const LABELS: Record<string, string> = {
  age: 'Age',
  isDCResident: 'DC Resident',
  citizenshipStatus: 'Citizenship Status',
  isPregnant: 'Pregnant',
  hasDisability: 'Has Disability',
  isVeteran: 'Veteran',
  householdSize: 'Household Size',
  childrenUnder18: 'Children Under 18',
  childrenAges: 'Children Ages',
  adultsOver65: 'Adults 65+',
  relationshipStatus: 'Relationship Status',
  isBreastfeeding: 'Breastfeeding',
  employmentStatus: 'Employment Status',
  worksForDCEmployer: 'Works for DC Employer',
  lostJobRecently: 'Lost Job Recently',
  lostJobNoFault: 'Lost Job (No Fault)',
  grossMonthlyIncome: 'Gross Monthly Income',
  earnedMonthlyIncome: 'Earned Monthly Income',
  annualIncome: 'Annual Income',
  housingSituation: 'Housing Situation',
  monthlyRent: 'Monthly Rent',
  hasHomesteadDeduction: 'Homestead Deduction',
  monthlyUtilities: 'Monthly Utilities',
  paysChildCare: 'Pays for Child Care',
  monthlyChildCare: 'Monthly Child Care Cost',
  monthlyMedicalExpenses: 'Monthly Medical Expenses',
  currentBenefits: 'Current Benefits',
};

const STATUS_LABELS: Record<string, string> = {
  us_citizen: 'U.S. Citizen',
  permanent_resident: 'Permanent Resident',
  other_immigration: 'Other Immigration Status',
  undocumented: 'Undocumented',
  prefer_not_to_say: 'Prefer not to say',
  single: 'Single',
  married: 'Married/Domestic Partnership',
  separated: 'Separated',
  widowed: 'Widowed',
  employed_full: 'Employed Full-Time',
  employed_part: 'Employed Part-Time',
  self_employed: 'Self-Employed',
  unemployed_looking: 'Unemployed (Looking)',
  unemployed_not_looking: 'Unemployed (Not Looking)',
  unable_to_work: 'Unable to Work',
  retired: 'Retired',
  student: 'Student',
  own: 'Own Home',
  rent: 'Rent',
  living_with_others: 'Living with Others',
  homeless: 'Homeless/Shelter',
  other: 'Other',
};

function formatValue(key: string, val: unknown): string {
  if (val === true) return 'Yes';
  if (val === false) return 'No';
  if (val === null) return 'Prefer not to say / Don\'t know';
  if (Array.isArray(val)) {
    if (val.length === 0) return 'None';
    return val.join(', ');
  }
  if (typeof val === 'string' && STATUS_LABELS[val]) return STATUS_LABELS[val];
  if (typeof val === 'number') {
    if (key.includes('Income') || key.includes('Rent') || key.includes('Utilities') || key.includes('Child Care') || key.includes('Medical')) {
      return `$${val.toLocaleString()}`;
    }
    return String(val);
  }
  return String(val ?? '');
}

export function ReviewScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const profile = (location.state as { profile: UserProfile })?.profile;

  if (!profile) {
    navigate('/questionnaire');
    return null;
  }

  const entries = Object.entries(profile).filter(
    ([, val]) => val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0 && true),
  );

  return (
    <Layout>
      <h1>Review your answers</h1>
      <p style={{ marginBottom: 'var(--space-lg)' }}>
        Please review the information below before we calculate your potential benefits.
        If anything looks wrong, go back and change it.
      </p>

      <table className="summary-table">
        <tbody>
          {entries.map(([key, val]) => (
            <tr key={key}>
              <th>{LABELS[key] || key}</th>
              <td>{formatValue(LABELS[key] || key, val)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="action-bar" style={{ marginTop: 'var(--space-xl)' }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/questionnaire')}
        >
          Go back and edit
        </button>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/results', { state: { profile } })}
        >
          Calculate my benefits
        </button>
      </div>
    </Layout>
  );
}
