import { Layout } from '../shared/Layout';

export function BudgetExceeded() {
  return (
    <Layout>
      <h1>Service temporarily unavailable</h1>
      <p>
        DC Benefits Finder has hit its monthly hosting budget. If you'd like to help keep
        this tool running, reach out to{' '}
        <a
          href="https://www.linkedin.com/in/maxwellgreenberg"
          target="_blank"
          rel="noopener noreferrer"
        >
          Max on LinkedIn
        </a>{' '}
        or email{' '}
        <a href="mailto:Maxwell.greenberg@gmail.com">Maxwell.greenberg@gmail.com</a>.
      </p>
    </Layout>
  );
}
