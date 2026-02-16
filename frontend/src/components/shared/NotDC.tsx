import { Layout } from './Layout';

export function NotDC() {
  return (
    <Layout>
      <h1>This tool is for DC residents</h1>
      <p style={{ marginBottom: 'var(--space-lg)' }}>
        DC Benefits Finder only covers programs available in Washington, DC.
      </p>
      <p>
        For benefits in other states, visit{' '}
        <a href="https://www.benefits.gov/" target="_blank" rel="noopener noreferrer">
          Benefits.gov
        </a>{' '}
        to find programs in your area.
      </p>
    </Layout>
  );
}
