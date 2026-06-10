'use client';

import { BlockProps } from '../ui';
import { CoreBlock } from '@/components/CoreBlock';
import { FormBlockConfig, FormBlockField } from '@trylinky/blocks';
import { InternalApi, internalApiFetcher } from '@trylinky/common';
import { toast } from '@trylinky/ui';
import { FormEvent, FunctionComponent, useState } from 'react';
import useSWR from 'swr';

const inputClasses =
  'min-w-0 w-full appearance-none rounded-md border border-sys-bg-border bg-sys-bg-primary px-3 py-1.5 text-base text-sys-label-primary placeholder:text-sys-label-primary/40 focus:border-sys-label-primary/60 focus:outline-none sm:text-sm sm:leading-6';

export const FormBlock: FunctionComponent<BlockProps> = (props) => {
  const { data } = useSWR<{ blockData: FormBlockConfig }>(
    `/blocks/${props.blockId}`,
    internalApiFetcher
  );

  const { blockData } = data || {};

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [round, setRound] = useState(0);

  if (!data) return null;

  const fields = blockData?.fields ?? [];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (props.isEditable) {
      toast({
        title: 'Form will not be submitted in edit mode',
        variant: 'error',
      });
      return;
    }

    const formData = new FormData(event.currentTarget);

    const answers: Record<string, string | boolean> = {};
    for (const field of fields) {
      if (field.type === 'checkbox') {
        answers[field.id] = formData.get(field.id) === 'on';
      } else {
        const value = formData.get(field.id);
        if (typeof value === 'string' && value.trim() !== '') {
          answers[field.id] = value.trim();
        }
      }
    }

    setIsSubmitting(true);

    try {
      const res = await InternalApi.post(
        `/forms/${props.blockId}/submissions`,
        {
          answers,
          website: (formData.get('website') as string) ?? '',
        }
      );

      if (res?.success) {
        setSubmitted(true);
        return;
      }

      toast({
        title: 'There was a problem submitting the form. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <CoreBlock
        {...props}
        className="flex flex-col items-start justify-center gap-4"
      >
        <p className="text-md text-sys-label-primary">
          {blockData?.successMessage || 'Thanks — your response was sent.'}
        </p>
        <button
          type="button"
          onClick={() => { setRound((r) => r + 1); setSubmitted(false); }}
          className="text-sm text-sys-label-secondary underline"
        >
          Submit another response
        </button>
      </CoreBlock>
    );
  }

  return (
    <CoreBlock {...props} className="flex flex-col">
      {blockData?.title && (
        <h2 className="mb-4 text-2xl font-medium text-sys-label-primary">
          {blockData.title}
        </h2>
      )}

      <form key={round} onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
        {fields.map((field) => (
          <FieldInput key={field.id} field={field} />
        ))}

        {/* Honeypot: hidden from humans; the API silently drops submissions
            that fill it. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 flex items-center justify-center self-start rounded-md bg-sys-label-primary px-4 py-2 text-sm font-semibold text-sys-bg-primary shadow-xs hover:bg-sys-label-primary/50 disabled:opacity-60"
        >
          {isSubmitting ? 'Sending…' : blockData?.submitLabel || 'Submit'}
        </button>
      </form>
    </CoreBlock>
  );
};

const FieldInput = ({ field }: { field: FormBlockField }) => {
  const maxLength = field.type === 'textarea' ? 5000 : 200;

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-sm text-sys-label-primary">
        <input
          type="checkbox"
          name={field.id}
          required={field.required}
          className="size-4 rounded [accent-color:hsl(var(--color-sys-label-primary))]"
        />
        {field.label}
        {field.required && <span aria-hidden="true">*</span>}
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-1 text-sm text-sys-label-secondary">
      <span>
        {field.label}
        {field.required && <span aria-hidden="true"> *</span>}
      </span>
      {field.type === 'textarea' ? (
        <textarea
          name={field.id}
          required={field.required}
          maxLength={maxLength}
          placeholder={field.placeholder}
          rows={4}
          className={inputClasses}
        />
      ) : field.type === 'select' ? (
        <select
          name={field.id}
          required={field.required}
          defaultValue=""
          className={inputClasses}
        >
          <option value="" disabled>
            {field.placeholder || 'Choose an option'}
          </option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type === 'email' ? 'email' : 'text'}
          name={field.id}
          required={field.required}
          maxLength={maxLength}
          placeholder={field.placeholder}
          className={inputClasses}
        />
      )}
    </label>
  );
};
