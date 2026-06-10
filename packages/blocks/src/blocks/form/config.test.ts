import { FormBlockSchema, formBlockDefaults } from './config';
import { describe, expect, it } from 'vitest';

const validField = {
  id: 'f-1',
  type: 'text',
  label: 'Name',
  required: false,
};

const validConfig = {
  title: 'Contact',
  submitLabel: 'Send',
  successMessage: 'Thanks!',
  fields: [validField],
};

describe('FormBlockSchema', () => {
  it('accepts the block defaults', async () => {
    await expect(
      FormBlockSchema.validate(formBlockDefaults, { strict: true })
    ).resolves.toBeTruthy();
  });

  it('accepts a minimal valid config', async () => {
    await expect(
      FormBlockSchema.validate(validConfig, { strict: true })
    ).resolves.toBeTruthy();
  });

  it('rejects an empty field list', async () => {
    await expect(
      FormBlockSchema.validate({ ...validConfig, fields: [] }, { strict: true })
    ).rejects.toThrow('at least one field');
  });

  it('rejects more than 10 fields', async () => {
    const fields = Array.from({ length: 11 }, (_, i) => ({
      ...validField,
      id: `f-${i}`,
    }));
    await expect(
      FormBlockSchema.validate({ ...validConfig, fields }, { strict: true })
    ).rejects.toThrow('at most 10 fields');
  });

  it('rejects duplicate field ids', async () => {
    const fields = [validField, { ...validField, label: 'Other' }];
    await expect(
      FormBlockSchema.validate({ ...validConfig, fields }, { strict: true })
    ).rejects.toThrow('unique');
  });

  it('rejects field ids with unsafe characters', async () => {
    const fields = [{ ...validField, id: 'bad id!' }];
    await expect(
      FormBlockSchema.validate({ ...validConfig, fields }, { strict: true })
    ).rejects.toThrow('letters, numbers');
  });

  it('rejects a field without a label', async () => {
    const fields = [{ ...validField, label: '' }];
    await expect(
      FormBlockSchema.validate({ ...validConfig, fields }, { strict: true })
    ).rejects.toThrow('needs a label');
  });

  it('rejects an unknown field type', async () => {
    const fields = [{ ...validField, type: 'file' }];
    await expect(
      FormBlockSchema.validate({ ...validConfig, fields }, { strict: true })
    ).rejects.toThrow('must be one of');
  });

  it('rejects a select field with fewer than 2 options', async () => {
    const fields = [
      { ...validField, type: 'select', options: ['Only one'] },
    ];
    await expect(
      FormBlockSchema.validate({ ...validConfig, fields }, { strict: true })
    ).rejects.toThrow('at least 2 options');
  });

  it('accepts a select field with valid options', async () => {
    const fields = [
      { ...validField, type: 'select', options: ['Support', 'Sales'] },
    ];
    await expect(
      FormBlockSchema.validate({ ...validConfig, fields }, { strict: true })
    ).resolves.toBeTruthy();
  });

  it('rejects a select field with no options property at all', async () => {
    const fields = [{ ...validField, type: 'select' }];
    await expect(
      FormBlockSchema.validate({ ...validConfig, fields }, { strict: true })
    ).rejects.toThrow();
  });

  it('accepts a field label of exactly 100 characters', async () => {
    const fields = [{ ...validField, label: 'a'.repeat(100) }];
    await expect(
      FormBlockSchema.validate({ ...validConfig, fields }, { strict: true })
    ).resolves.toBeTruthy();
  });

  it('rejects a field label of 101 characters', async () => {
    const fields = [{ ...validField, label: 'a'.repeat(101) }];
    await expect(
      FormBlockSchema.validate({ ...validConfig, fields }, { strict: true })
    ).rejects.toThrow('at most 100 characters');
  });

  it('accepts a select field with exactly 20 options', async () => {
    const options = Array.from({ length: 20 }, (_, i) => `opt-${i}`);
    const fields = [{ ...validField, type: 'select', options }];
    await expect(
      FormBlockSchema.validate({ ...validConfig, fields }, { strict: true })
    ).resolves.toBeTruthy();
  });

  it('rejects a select field with 21 options', async () => {
    const options = Array.from({ length: 21 }, (_, i) => `opt-${i}`);
    const fields = [{ ...validField, type: 'select', options }];
    await expect(
      FormBlockSchema.validate({ ...validConfig, fields }, { strict: true })
    ).rejects.toThrow('at most 20 options');
  });

  it('allows a non-select field to omit options', async () => {
    await expect(
      FormBlockSchema.validate(
        { ...validConfig, fields: [{ ...validField, type: 'textarea' }] },
        { strict: true }
      )
    ).resolves.toBeTruthy();
  });

  it('rejects a missing submit label', async () => {
    await expect(
      FormBlockSchema.validate(
        { ...validConfig, submitLabel: undefined },
        { strict: true }
      )
    ).rejects.toThrow('submit button label');
  });
});
