interface ProgressBarProps {
  current: number;
  total: number;
  sectionName: string;
}

export function ProgressBar({ current, total, sectionName }: ProgressBarProps) {
  const percent = Math.round((current / total) * 100);
  return (
    <div>
      <p className="progress-text" aria-live="polite">
        Question {current} of {total} &mdash; {sectionName}
      </p>
      <div
        className="progress-bar"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${percent}%`}
      >
        <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
