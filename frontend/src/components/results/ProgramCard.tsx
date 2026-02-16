import { useState } from 'react';
import type { ProgramResult } from '../../engine/types';

interface ProgramCardProps {
  result: ProgramResult;
  variant: 'success' | 'warning' | 'muted';
}

export function ProgramCard({ result, variant }: ProgramCardProps) {
  const [expanded, setExpanded] = useState(variant !== 'muted');
  const cardClass = `card card-${variant}`;

  return (
    <div className={cardClass}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 'var(--space-md)',
        }}
      >
        <div>
          <h3 style={{ marginBottom: 'var(--space-xs)' }}>{result.programName}</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
            {result.description}
          </p>
        </div>
        {variant === 'muted' && (
          <button
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            {expanded ? 'Hide' : 'Show details'}
          </button>
        )}
      </div>

      {expanded && (
        <div style={{ marginTop: 'var(--space-md)' }}>
          {result.estimatedBenefit && (
            <p
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: variant === 'success' ? 'var(--color-success)' : 'var(--color-warning)',
                marginBottom: 'var(--space-sm)',
              }}
            >
              {result.estimatedBenefit.label}
            </p>
          )}

          <div style={{ marginBottom: 'var(--space-sm)' }}>
            <strong>
              {variant === 'muted'
                ? "Why you probably don't qualify:"
                : 'Why we think you qualify:'}
            </strong>
            <ul style={{ paddingLeft: '1.25rem', marginTop: 'var(--space-xs)' }}>
              {result.reasoning.map((reason, i) => (
                <li key={i} style={{ marginBottom: 'var(--space-xs)', fontSize: '0.9375rem' }}>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {result.caveats.length > 0 && (
            <div style={{ marginBottom: 'var(--space-sm)' }}>
              <strong>Things to know:</strong>
              <ul style={{ paddingLeft: '1.25rem', marginTop: 'var(--space-xs)' }}>
                {result.caveats.map((caveat, i) => (
                  <li key={i} style={{ marginBottom: 'var(--space-xs)', fontSize: '0.9375rem' }}>
                    {caveat}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: 'var(--space-md)' }}>
            <strong>How to apply:</strong>
            <p style={{ fontSize: '0.9375rem', marginTop: 'var(--space-xs)' }}>
              {result.applyInstructions}
            </p>
            <a
              href={result.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ marginTop: 'var(--space-sm)', display: 'inline-block' }}
            >
              Apply now
            </a>
          </div>

          {result.sourceUrls.length > 0 && (
            <details style={{ marginTop: 'var(--space-md)', fontSize: '0.875rem' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                Sources
              </summary>
              <ul style={{ paddingLeft: '1.25rem', marginTop: 'var(--space-xs)' }}>
                {result.sourceUrls.map((url, i) => (
                  <li key={i}>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
