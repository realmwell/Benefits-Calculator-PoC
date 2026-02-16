import { useState, useRef, useEffect } from 'react';
import type { Question } from './questions';

interface QuestionScreenProps {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
  error?: string;
}

export function QuestionScreen({
  question,
  value,
  onChange,
  onNext,
  onBack,
  isFirst,
  isLast,
  error,
}: QuestionScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [question.id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && question.type !== 'multi_select' && question.type !== 'number_list') {
      e.preventDefault();
      onNext();
    }
  };

  return (
    <div className="question-enter" onKeyDown={handleKeyDown}>
      <div className="section-header">
        Section {question.sectionNumber}: {question.section}
      </div>

      <h1 ref={headingRef} tabIndex={-1} style={{ outline: 'none' }}>
        {question.label}
      </h1>

      {question.helpText && (
        <p className="form-hint">{question.helpText}</p>
      )}

      <div className="form-group">
        {renderInput(question, value, onChange)}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="action-bar">
        {!isFirst && (
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            Back
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={onNext}>
          {isLast ? 'Review my answers' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

function renderInput(
  question: Question,
  value: unknown,
  onChange: (value: unknown) => void,
) {
  switch (question.type) {
    case 'number':
      return (
        <input
          type="number"
          className="form-input form-input-number"
          value={value === undefined || value === null ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          placeholder={question.placeholder}
          min={question.min}
          max={question.max}
          aria-label={question.label}
          inputMode="numeric"
        />
      );

    case 'currency':
      return (
        <div style={{ position: 'relative', maxWidth: '12rem' }}>
          <span
            style={{
              position: 'absolute',
              left: '0.625rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-secondary)',
              fontWeight: 700,
            }}
          >
            $
          </span>
          <input
            type="number"
            className="form-input form-input-currency"
            style={{ paddingLeft: '1.5rem' }}
            value={value === undefined || value === null ? '' : String(value)}
            onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
            placeholder={question.placeholder}
            min={question.min}
            aria-label={question.label}
            inputMode="decimal"
          />
        </div>
      );

    case 'yes_no':
      return (
        <div className="radio-group" role="radiogroup" aria-label={question.label}>
          <div className="radio-item">
            <input
              type="radio"
              id={`${question.id}-yes`}
              name={question.id}
              checked={value === true}
              onChange={() => onChange(true)}
            />
            <label htmlFor={`${question.id}-yes`}>Yes</label>
          </div>
          <div className="radio-item">
            <input
              type="radio"
              id={`${question.id}-no`}
              name={question.id}
              checked={value === false}
              onChange={() => onChange(false)}
            />
            <label htmlFor={`${question.id}-no`}>No</label>
          </div>
        </div>
      );

    case 'yes_no_prefer_not':
      return (
        <div className="radio-group" role="radiogroup" aria-label={question.label}>
          <div className="radio-item">
            <input
              type="radio"
              id={`${question.id}-yes`}
              name={question.id}
              checked={value === true}
              onChange={() => onChange(true)}
            />
            <label htmlFor={`${question.id}-yes`}>Yes</label>
          </div>
          <div className="radio-item">
            <input
              type="radio"
              id={`${question.id}-no`}
              name={question.id}
              checked={value === false}
              onChange={() => onChange(false)}
            />
            <label htmlFor={`${question.id}-no`}>No</label>
          </div>
          <div className="radio-item">
            <input
              type="radio"
              id={`${question.id}-pnts`}
              name={question.id}
              checked={value === null}
              onChange={() => onChange(null)}
            />
            <label htmlFor={`${question.id}-pnts`}>
              {question.id === 'hasHomesteadDeduction' ? "I don't know" : 'Prefer not to say'}
            </label>
          </div>
        </div>
      );

    case 'select':
      return (
        <div className="radio-group" role="radiogroup" aria-label={question.label}>
          {question.options?.map((option) => (
            <div className="radio-item" key={option.value}>
              <input
                type="radio"
                id={`${question.id}-${option.value}`}
                name={question.id}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
              />
              <label htmlFor={`${question.id}-${option.value}`}>{option.label}</label>
            </div>
          ))}
        </div>
      );

    case 'multi_select':
      return <MultiSelectInput question={question} value={value} onChange={onChange} />;

    case 'number_list':
      return <NumberListInput question={question} value={value} onChange={onChange} />;

    default:
      return null;
  }
}

function MultiSelectInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const selected = (value as string[]) || [];

  const toggle = (optionValue: string) => {
    if (optionValue === 'none') {
      onChange(['none']);
      return;
    }
    const without = selected.filter((v) => v !== 'none');
    if (without.includes(optionValue)) {
      onChange(without.filter((v) => v !== optionValue));
    } else {
      onChange([...without, optionValue]);
    }
  };

  return (
    <div className="checkbox-group" role="group" aria-label={question.label}>
      {question.options?.map((option) => (
        <div className="checkbox-item" key={option.value}>
          <input
            type="checkbox"
            id={`${question.id}-${option.value}`}
            checked={selected.includes(option.value)}
            onChange={() => toggle(option.value)}
          />
          <label htmlFor={`${question.id}-${option.value}`}>{option.label}</label>
        </div>
      ))}
    </div>
  );
}

function NumberListInput({
  value,
  onChange,
}: {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const ages = (value as number[]) || [];
  const [inputVal, setInputVal] = useState('');

  const addAge = () => {
    const num = Number(inputVal);
    if (!isNaN(num) && num >= 0 && num <= 17) {
      onChange([...ages, num]);
      setInputVal('');
    }
  };

  const removeAge = (index: number) => {
    onChange(ages.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
        <input
          type="number"
          className="form-input form-input-number"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAge(); } }}
          placeholder="Age"
          min={0}
          max={17}
          aria-label={`Enter child's age`}
          inputMode="numeric"
        />
        <button type="button" className="btn btn-secondary" onClick={addAge}>
          Add
        </button>
      </div>

      {ages.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          {ages.map((age, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                padding: '0.25rem 0.75rem',
                background: 'var(--color-primary-light)',
                fontWeight: 700,
              }}
            >
              {age} years
              <button
                type="button"
                onClick={() => removeAge(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  lineHeight: 1,
                  padding: '0 0.25rem',
                  color: 'var(--color-text-secondary)',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label={`Remove child age ${age}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
