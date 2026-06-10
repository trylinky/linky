import { validateAnswers } from './validate-answers';
import { FormBlockField } from '@trylinky/blocks';
import { describe, expect, it } from 'vitest';

const fields: FormBlockField[] = [
  { id: 'f-name', type: 'text', label: 'Name', required: false },
  { id: 'f-email', type: 'email', label: 'Email', required: true },
  { id: 'f-message', type: 'textarea', label: 'Message', required: false },
  {
    id: 'f-topic',
    type: 'select',
    label: 'Topic',
    required: false,
    options: ['Support', 'Sales'],
  },
  { id: 'f-consent', type: 'checkbox', label: 'Consent', required: false },
];

describe('validateAnswers', () => {
  it('accepts a valid submission and returns sanitized answers', () => {
    const result = validateAnswers(fields, {
      'f-name': '  Alex  ',
      'f-email': 'alex@example.com',
      'f-topic': 'Support',
      'f-consent': true,
    });

    expect(result).toEqual({
      ok: true,
      answers: {
        'f-name': 'Alex',
        'f-email': 'alex@example.com',
        'f-topic': 'Support',
        'f-consent': true,
      },
    });
  });

  it('rejects non-object payloads', () => {
    expect(validateAnswers(fields, 'nope').ok).toBe(false);
    expect(validateAnswers(fields, null).ok).toBe(false);
    expect(validateAnswers(fields, ['a']).ok).toBe(false);
  });

  it('rejects unknown field ids', () => {
    const result = validateAnswers(fields, {
      'f-email': 'alex@example.com',
      'f-evil': 'payload',
    });
    expect(result.ok).toBe(false);
  });

  it('rejects when a required field is missing', () => {
    const result = validateAnswers(fields, { 'f-name': 'Alex' });
    expect(result).toMatchObject({
      ok: false,
      errors: { 'f-email': expect.stringContaining('required') },
    });
  });

  it('rejects when a required field is whitespace only', () => {
    const result = validateAnswers(fields, { 'f-email': '   ' });
    expect(result.ok).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = validateAnswers(fields, { 'f-email': 'not-an-email' });
    expect(result).toMatchObject({
      ok: false,
      errors: { 'f-email': expect.stringContaining('valid email') },
    });
  });

  it('rejects a select answer not in the configured options', () => {
    const result = validateAnswers(fields, {
      'f-email': 'alex@example.com',
      'f-topic': 'Gossip',
    });
    expect(result.ok).toBe(false);
  });

  it('rejects any answer to a select field whose config has no options (malformed config)', () => {
    const malformed: FormBlockField[] = [
      { id: 'f-pick', type: 'select', label: 'Pick', required: false },
    ];
    const result = validateAnswers(malformed, { 'f-pick': 'anything' });
    expect(result.ok).toBe(false);
  });

  it('rejects oversize answers', () => {
    const result = validateAnswers(fields, {
      'f-email': 'alex@example.com',
      'f-name': 'x'.repeat(201),
    });
    expect(result.ok).toBe(false);
  });

  it('allows textarea answers up to 5000 chars but not beyond', () => {
    const ok = validateAnswers(fields, {
      'f-email': 'alex@example.com',
      'f-message': 'x'.repeat(5000),
    });
    expect(ok.ok).toBe(true);

    const tooLong = validateAnswers(fields, {
      'f-email': 'alex@example.com',
      'f-message': 'x'.repeat(5001),
    });
    expect(tooLong.ok).toBe(false);
  });

  it('coerces checkbox values: only literal true counts as checked', () => {
    const result = validateAnswers(fields, {
      'f-email': 'alex@example.com',
      'f-consent': 'true',
    });
    // 'true' (string) is not a boolean — checkbox answers must be booleans
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.answers['f-consent']).toBe(false);
    }
  });

  it('fails a required checkbox that is not checked', () => {
    const requiredConsent: FormBlockField[] = [
      { id: 'f-consent', type: 'checkbox', label: 'Consent', required: true },
    ];
    expect(validateAnswers(requiredConsent, {}).ok).toBe(false);
    expect(validateAnswers(requiredConsent, { 'f-consent': true }).ok).toBe(true);
  });

  it('rejects non-string values for text fields', () => {
    const result = validateAnswers(fields, {
      'f-email': 'alex@example.com',
      'f-name': 42,
    });
    expect(result.ok).toBe(false);
  });

  it('omits empty optional answers from the result', () => {
    const result = validateAnswers(fields, {
      'f-email': 'alex@example.com',
      'f-name': '',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect('f-name' in result.answers).toBe(false);
    }
  });
});
