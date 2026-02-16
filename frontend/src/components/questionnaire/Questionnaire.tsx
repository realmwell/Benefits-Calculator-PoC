import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile } from '../../engine/types';
import { getVisibleQuestions } from './questions';
import { ProgressBar } from './ProgressBar';
import { QuestionScreen } from './QuestionScreen';
import { Layout } from '../shared/Layout';

const DEFAULT_PROFILE: UserProfile = {
  age: 0,
  isDCResident: true,
  citizenshipStatus: 'us_citizen',
  isPregnant: null,
  hasDisability: false,
  isVeteran: false,
  householdSize: 1,
  childrenUnder18: 0,
  childrenAges: [],
  adultsOver65: 0,
  relationshipStatus: 'single',
  isBreastfeeding: false,
  employmentStatus: 'employed_full',
  worksForDCEmployer: false,
  lostJobRecently: false,
  lostJobNoFault: false,
  grossMonthlyIncome: 0,
  earnedMonthlyIncome: 0,
  annualIncome: 0,
  housingSituation: 'rent',
  monthlyRent: 0,
  hasHomesteadDeduction: null,
  monthlyUtilities: 0,
  paysChildCare: false,
  monthlyChildCare: 0,
  monthlyMedicalExpenses: 0,
  currentBenefits: [],
};

export function Questionnaire() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Partial<UserProfile>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | undefined>();

  const visibleQuestions = getVisibleQuestions(answers);
  const currentQuestion = visibleQuestions[currentIndex];
  const totalQuestions = visibleQuestions.length;

  const currentValue = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;

  const handleChange = useCallback(
    (value: unknown) => {
      if (!currentQuestion) return;
      setError(undefined);
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: value,
      }));
    },
    [currentQuestion],
  );

  const validate = (): boolean => {
    if (!currentQuestion) return true;
    const val = answers[currentQuestion.id];

    // Required fields
    if (val === undefined) {
      // Allow 0 for numbers/currency
      if (currentQuestion.type === 'number' || currentQuestion.type === 'currency') {
        if (val === undefined) {
          setError('Please enter a value.');
          return false;
        }
      } else {
        setError('Please select an answer.');
        return false;
      }
    }

    // Age validation
    if (currentQuestion.id === 'age' && (typeof val !== 'number' || val < 0 || val > 120)) {
      setError('Please enter a valid age.');
      return false;
    }

    // DC resident hard stop
    if (currentQuestion.id === 'isDCResident' && val === false) {
      navigate('/not-dc');
      return false;
    }

    return true;
  };

  const handleNext = useCallback(() => {
    if (!validate()) return;

    if (currentIndex >= totalQuestions - 1) {
      // Build complete profile and navigate to review
      const profile: UserProfile = { ...DEFAULT_PROFILE, ...answers };

      // Auto-calculate annual income if not provided
      if (!profile.annualIncome && profile.grossMonthlyIncome > 0) {
        profile.annualIncome = profile.grossMonthlyIncome * 12;
      }

      // Clean up "none" from currentBenefits
      if (profile.currentBenefits.includes('none')) {
        profile.currentBenefits = [];
      }

      navigate('/review', { state: { profile } });
    } else {
      setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
      setError(undefined);
    }
  }, [currentIndex, totalQuestions, answers, navigate]);

  const handleBack = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
    setError(undefined);
  }, []);

  if (!currentQuestion) {
    return (
      <Layout>
        <p>Loading questions...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <ProgressBar
        current={currentIndex + 1}
        total={totalQuestions}
        sectionName={currentQuestion.section}
      />
      <QuestionScreen
        question={currentQuestion}
        value={currentValue}
        onChange={handleChange}
        onNext={handleNext}
        onBack={handleBack}
        isFirst={currentIndex === 0}
        isLast={currentIndex >= totalQuestions - 1}
        error={error}
      />
    </Layout>
  );
}
