'use client';

import { BlockProps } from '../ui';
import { submitSignupToWaitlistCom } from './action';
import { CoreBlock } from '@/components/CoreBlock';
import { WaitlistEmailBlockConfig } from '@trylinky/blocks';
import { internalApiFetcher } from '@trylinky/common';
import { toast } from '@trylinky/ui';
import { FunctionComponent, useState } from 'react';
import { useFormStatus } from 'react-dom';
import useSWR from 'swr';

export const WaitlistEmail: FunctionComponent<BlockProps> = (props) => {
  const { data } = useSWR<{ blockData: WaitlistEmailBlockConfig }>(
    `/blocks/${props.blockId}`,
    internalApiFetcher
  );

  const { blockData } = data || {};

  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    if (props.isEditable) {
      toast({
        title: 'Form will not be submitted in edit mode',
        variant: 'error',
      });

      return;
    }

    if (!data) {
      toast({
        title: 'No data found',
        variant: 'error',
      });

      return;
    }

    if (blockData?.waitlistId) {
      formData.append('waitlist_id', blockData?.waitlistId);
    }

    const req = await submitSignupToWaitlistCom(formData);

    if (req?.success) {
      toast({
        title: 'Form submitted successfully',
        variant: 'default',
      });

      setFormSubmitted(true);

      return;
    }

    toast({
      title: 'There was a problem submitting the form. Please try again.',
      variant: 'error',
    });

    return;
  };

  if (!data) return null;
  return (
    <CoreBlock {...props} className="flex flex-col">
      <h2 className="text-2xl font-medium text-sys-label-primary">
        {blockData?.title}
      </h2>
      <p className="text-md text-sys-label-secondary mb-6">
        {blockData?.label}
      </p>

      <form action={handleSubmit} className="mt-auto flex w-full">
        <label htmlFor="email-address" className="sr-only">
          Email address
        </label>
        <input
          type="email"
          name="email"
          id="email"
          autoComplete="email"
          required
          className="min-w-0 w-full flex-1 appearance-none rounded-md border-0 bg-sys-bg-primary px-3 py-1.5 text-base text-sys-label-primary shadow-sm ring-1 ring-inset ring-sys-bg-secondary/50 placeholder:text-gray-400 focus:ring-sys-bg-secondary/90 sm:w-64 sm:text-sm sm:leading-6 xl:w-full"
          placeholder="Enter your email"
        />
        <div className="ml-4 sm:flex-shrink-0">
          <SubmitButton
            buttonLabel={blockData?.buttonLabel || 'Submit'}
            disabled={!!formSubmitted}
          />
        </div>
      </form>
    </CoreBlock>
  );
};

const SubmitButton = ({
  buttonLabel,
  disabled,
}: {
  buttonLabel: string;
  disabled?: boolean;
}) => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="flex w-full items-center justify-center rounded-md bg-sys-label-primary px-3 py-2 text-sm font-semibold text-sys-bg-primary shadow-sm hover:bg-sys-label-primary/50 relative overflow-hidden"
      disabled={disabled}
    >
      {buttonLabel}
      {pending && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/70">
          <svg
            className="animate-spin h-5 w-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}
    </button>
  );
};
