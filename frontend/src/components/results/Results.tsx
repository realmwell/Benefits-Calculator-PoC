import { useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import type { UserProfile } from '../../engine/types';
import { evaluateEligibility } from '../../engine/eligibility';
import { ProgramCard } from './ProgramCard';
import { Layout } from '../shared/Layout';

export function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const profile = (location.state as { profile: UserProfile })?.profile;

  const results = useMemo(() => {
    if (!profile) return null;
    return evaluateEligibility(profile);
  }, [profile]);

  if (!profile || !results) {
    navigate('/questionnaire');
    return null;
  }

  const {
    likelyEligible,
    mayBeEligible,
    likelyIneligible,
    totalEstimatedMonthly,
    totalEstimatedAnnual,
  } = results;

  return (
    <Layout>
      <h1>Your benefits results</h1>

      {(likelyEligible.length > 0 || mayBeEligible.length > 0) && (
        <div
          style={{
            background: 'var(--color-success-bg)',
            border: '1px solid var(--color-success)',
            padding: 'var(--space-lg)',
            marginBottom: 'var(--space-xl)',
          }}
        >
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)' }}>
            You may be eligible for {likelyEligible.length + mayBeEligible.length} benefit
            {likelyEligible.length + mayBeEligible.length !== 1 ? 's' : ''}
          </p>
          {totalEstimatedMonthly > 0 && (
            <p style={{ fontSize: '1.125rem', marginTop: 'var(--space-sm)' }}>
              Estimated total: up to <strong>${totalEstimatedMonthly.toLocaleString()}/month</strong>
              {totalEstimatedAnnual > 0 && (
                <> (${totalEstimatedAnnual.toLocaleString()}/year)</>
              )}
            </p>
          )}
        </div>
      )}

      {likelyEligible.length > 0 && (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h2>You're likely eligible for these programs</h2>
          {likelyEligible.map((result) => (
            <ProgramCard key={result.programId} result={result} variant="success" />
          ))}
        </section>
      )}

      {mayBeEligible.length > 0 && (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h2>You may also qualify for</h2>
          {mayBeEligible.map((result) => (
            <ProgramCard key={result.programId} result={result} variant="warning" />
          ))}
        </section>
      )}

      {likelyIneligible.length > 0 && (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h2>Based on your answers, you probably don't qualify for</h2>
          {likelyIneligible.map((result) => (
            <ProgramCard key={result.programId} result={result} variant="muted" />
          ))}
        </section>
      )}

      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h2>Have questions?</h2>
        <p>
          Use our <Link to="/chat">chat assistant</Link> to ask specific
          questions about DC benefit programs.
        </p>
      </div>

      <div className="action-bar">
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/review', { state: { profile } })}
        >
          Back to review
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/questionnaire')}
        >
          Start over
        </button>
      </div>

      <div className="disclaimer">
        <p>
          <strong>Estimates only.</strong> This tool is not an official government tool and
          does not guarantee eligibility for any program. Actual eligibility is determined by the
          administering agency when you apply. Benefit amounts are estimates and may differ from
          actual awards.
        </p>
        <p>
          This tool does not store any of your information. When you close this page, your data is gone.
        </p>
        <p>
          Built as a proof of concept. Not affiliated with the DC government.
          Last updated: February 2026. Benefit rules and thresholds may have changed.
        </p>
      </div>
    </Layout>
  );
}
