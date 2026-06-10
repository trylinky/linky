import { FormBlockField } from '@trylinky/blocks';

const MAX_TEXT_LENGTH = 200;
const MAX_TEXTAREA_LENGTH = 5000;
// Deliberately simple: server-side sanity check, not RFC 5322.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ValidationResult =
  | { ok: true; answers: Record<string, string | boolean> }
  | { ok: false; errors: Record<string, string> };

export function validateAnswers(
  fields: FormBlockField[],
  rawAnswers: unknown
): ValidationResult {
  if (
    typeof rawAnswers !== 'object' ||
    rawAnswers === null ||
    Array.isArray(rawAnswers)
  ) {
    return { ok: false, errors: { _form: 'Invalid submission' } };
  }

  const raw = rawAnswers as Record<string, unknown>;
  const fieldIds = new Set(fields.map((field) => field.id));

  for (const key of Object.keys(raw)) {
    if (!fieldIds.has(key)) {
      return { ok: false, errors: { _form: 'Unknown field in submission' } };
    }
  }

  const errors: Record<string, string> = {};
  const answers: Record<string, string | boolean> = {};

  for (const field of fields) {
    const value = raw[field.id];

    if (field.type === 'checkbox') {
      const checked = value === true;
      if (field.required && !checked) {
        errors[field.id] = `${field.label} is required`;
        continue;
      }
      answers[field.id] = checked;
      continue;
    }

    if (value === undefined || value === null || value === '') {
      if (field.required) {
        errors[field.id] = `${field.label} is required`;
      }
      continue;
    }

    if (typeof value !== 'string') {
      errors[field.id] = `${field.label} has an invalid value`;
      continue;
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      if (field.required) {
        errors[field.id] = `${field.label} is required`;
      }
      continue;
    }

    const maxLength =
      field.type === 'textarea' ? MAX_TEXTAREA_LENGTH : MAX_TEXT_LENGTH;
    if (trimmed.length > maxLength) {
      errors[field.id] = `${field.label} is too long`;
      continue;
    }

    if (field.type === 'email' && !EMAIL_REGEX.test(trimmed)) {
      errors[field.id] = `${field.label} must be a valid email address`;
      continue;
    }

    if (field.type === 'select' && !(field.options ?? []).includes(trimmed)) {
      errors[field.id] = `${field.label} has an invalid option`;
      continue;
    }

    answers[field.id] = trimmed;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, answers };
}
