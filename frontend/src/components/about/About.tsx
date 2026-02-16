import { Layout } from '../shared/Layout';

export function About() {
  return (
    <Layout>
      <h1>About DC Benefits Finder</h1>

      <section style={{ marginBottom: 'var(--space-xl)' }}>
        <h2>What this is</h2>
        <p>
          DC Benefits Finder is a proof-of-concept tool that helps Washington, DC residents
          discover government benefits they may be eligible for but aren't claiming. Inspired
          by{' '}
          <a href="https://missingbenefit.com" target="_blank" rel="noopener noreferrer">
            MissingBenefit.com
          </a>
          , a UK benefits calculator built by Tom Loosemore (co-founder of the UK Government
          Digital Service).
        </p>
      </section>

      <section style={{ marginBottom: 'var(--space-xl)' }}>
        <h2>Who built it</h2>
        <p>
          Built by{' '}
          <a
            href="https://www.linkedin.com/in/maxwellgreenberg"
            target="_blank"
            rel="noopener noreferrer"
          >
            Max Greenberg
          </a>
          . For questions, feedback, or to discuss this project, reach out at{' '}
          <a href="mailto:Maxwell.greenberg@gmail.com">Maxwell.greenberg@gmail.com</a>.
        </p>
      </section>

      <section style={{ marginBottom: 'var(--space-xl)' }}>
        <h2>How it works</h2>
        <p>DC Benefits Finder operates in two modes:</p>
        <ol style={{ paddingLeft: '1.5rem', lineHeight: '2' }}>
          <li>
            <strong>Questionnaire:</strong> A step-by-step intake form collects household and
            income information, then runs eligibility logic to produce a personalized list of
            programs you likely qualify for, with estimated benefit amounts and links to apply.
          </li>
          <li>
            <strong>Chat assistant:</strong> Ask questions about DC benefits in plain English.
            The chatbot retrieves relevant passages from official DC government documentation
            and generates answers with source citations.
          </li>
        </ol>
      </section>

      <section style={{ marginBottom: 'var(--space-xl)' }}>
        <h2>Solution architecture</h2>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: '2' }}>
          <li>
            <strong>Frontend:</strong> React single-page app hosted on S3 + CloudFront.
            All eligibility logic runs in-browser (no server needed for the questionnaire).
          </li>
          <li>
            <strong>Chat backend:</strong> AWS Lambda + Amazon Bedrock. User questions are
            embedded, matched against a FAISS vector index of DC benefits documentation, and
            answered by Claude Haiku with source citations.
          </li>
          <li>
            <strong>Cost:</strong> Designed to run for under $5/month at low traffic, with a
            hard budget cap of $10/month.
          </li>
        </ul>
        <p style={{ marginTop: 'var(--space-sm)' }}>
          Full source code:{' '}
          <a
            href="https://github.com/maxwellgreenberg/dc-benefits-finder"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/maxwellgreenberg/dc-benefits-finder
          </a>
        </p>
      </section>

      <section style={{ marginBottom: 'var(--space-xl)' }}>
        <h2>Data sources</h2>
        <p>
          All eligibility thresholds and program details come from official government sources.
          Key sources include:
        </p>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8', fontSize: '0.9375rem' }}>
          <li><a href="https://aspe.hhs.gov/poverty-guidelines" target="_blank" rel="noopener noreferrer">HHS Poverty Guidelines (2025)</a></li>
          <li><a href="https://dhs.dc.gov/service/snap" target="_blank" rel="noopener noreferrer">DC DHS SNAP</a></li>
          <li><a href="https://www.fns.usda.gov/snap/allotment" target="_blank" rel="noopener noreferrer">USDA SNAP Allotments (FY2025)</a></li>
          <li><a href="https://dhcf.dc.gov" target="_blank" rel="noopener noreferrer">DC DHCF (Medicaid)</a></li>
          <li><a href="https://dhcf.dc.gov/service/dc-healthcare-alliance" target="_blank" rel="noopener noreferrer">DC Healthcare Alliance</a></li>
          <li><a href="https://dhs.dc.gov/service/temporary-cash-assistance-needy-families-tanf" target="_blank" rel="noopener noreferrer">DC DHS TANF</a></li>
          <li><a href="https://otr.cfo.dc.gov/page/dc-eitc" target="_blank" rel="noopener noreferrer">DC EITC (OTR)</a></li>
          <li><a href="https://dcpaidfamilyleave.dc.gov" target="_blank" rel="noopener noreferrer">DC Paid Family Leave</a></li>
          <li><a href="https://does.dc.gov/service/unemployment-compensation" target="_blank" rel="noopener noreferrer">DC Unemployment Insurance</a></li>
          <li><a href="https://doee.dc.gov/liheap" target="_blank" rel="noopener noreferrer">LIHEAP (DC DOEE)</a></li>
          <li><a href="https://dchealth.dc.gov/service/wic" target="_blank" rel="noopener noreferrer">DC WIC</a></li>
          <li><a href="https://osse.dc.gov/childcaresubsidyfaq" target="_blank" rel="noopener noreferrer">DC Child Care Subsidy</a></li>
          <li><a href="https://otr.cfo.dc.gov/page/real-property-tax-reliefs-credits-and-deductions" target="_blank" rel="noopener noreferrer">DC Property Tax Relief</a></li>
          <li><a href="https://www.ssa.gov/ssi" target="_blank" rel="noopener noreferrer">SSI (SSA)</a></li>
          <li><a href="https://osse.dc.gov/service/national-school-lunch-program" target="_blank" rel="noopener noreferrer">DC School Meals (OSSE)</a></li>
          <li><a href="https://kidsridefree.dc.gov" target="_blank" rel="noopener noreferrer">Kids Ride Free</a></li>
        </ul>
      </section>

      <section style={{ marginBottom: 'var(--space-xl)' }}>
        <h2>Limitations</h2>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: '2' }}>
          <li>This is a proof of concept, not an official government tool.</li>
          <li>Benefit thresholds change annually and may be outdated.</li>
          <li>Eligibility estimates are not guarantees. Only the administering agency can make an official determination.</li>
          <li>Does not cover all DC programs (e.g., housing vouchers, emergency rental assistance).</li>
          <li>English only (multi-language support planned).</li>
          <li>Not a substitute for talking to a caseworker or benefits counselor.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 'var(--space-xl)' }}>
        <h2>Open source</h2>
        <p>
          DC Benefits Finder is open source under the MIT License. Contributions welcome.
        </p>
        <p>
          <a
            href="https://github.com/maxwellgreenberg/dc-benefits-finder"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For questions, feedback, or funding inquiries:{' '}
          <a href="mailto:Maxwell.greenberg@gmail.com">Maxwell.greenberg@gmail.com</a> or{' '}
          <a
            href="https://www.linkedin.com/in/maxwellgreenberg"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
        </p>
      </section>
    </Layout>
  );
}
