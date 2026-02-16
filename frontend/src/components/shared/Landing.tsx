import { Link } from 'react-router-dom';
import { Layout } from './Layout';

export function Landing() {
  return (
    <Layout>
      <h1>Find benefits you may be missing</h1>
      <p style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
        Billions of dollars in government benefits go unclaimed every year.
        DC Benefits Finder helps Washington, DC residents discover programs they
        may be eligible for but aren't using.
      </p>

      <div style={{ marginBottom: '2rem' }}>
        <h2>How it works</h2>
        <ol style={{ paddingLeft: '1.5rem', lineHeight: '2' }}>
          <li>Answer a few questions about your household and income</li>
          <li>Get a personalized list of benefits you may qualify for</li>
          <li>See estimated benefit amounts and how to apply</li>
        </ol>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <Link to="/questionnaire" className="btn btn-primary btn-large">
          Start now
        </Link>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Or ask a question</h2>
        <p>
          Not sure where to start? Use our{' '}
          <Link to="/chat">chat assistant</Link> to ask questions about DC
          benefits in plain English.
        </p>
      </div>

      <div className="disclaimer">
        <p>
          <strong>Your privacy matters.</strong> This tool does not store any of
          your information. No accounts, no cookies, no tracking. When you close
          this page, your data is gone.
        </p>
        <p>
          This is a proof of concept, not an official government tool. It
          provides estimates only and does not guarantee eligibility for any
          program. Built as an open-source civic tech project.
        </p>
      </div>
    </Layout>
  );
}
