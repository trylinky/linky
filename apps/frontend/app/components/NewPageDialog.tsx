'use client';

import { HandleStep, SlugAvailability } from './HandleStep';
import { PagePreview } from './PagePreview';
import { ThemeStep } from './ThemeStep';
import { isForbiddenSlug, isReservedSlug, regexSlug } from '@/lib/slugs';
import { defaultThemeSeeds } from '@/lib/theme';
import { captureException } from '@sentry/nextjs';
import { InternalApi } from '@trylinky/common';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  useToast,
  cn,
} from '@trylinky/ui';
import { Formik, Form, FormikHelpers, useFormikContext } from 'formik';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, ReactNode } from 'react';
import * as Yup from 'yup';

const FormSchema = Yup.object().shape({
  pageSlug: Yup.string()
    .trim()
    .required('Please provide a page handle')
    .matches(
      regexSlug,
      'Please only use lowercase letters, numbers and underscores'
    ),
  themeId: Yup.string().required('Please select a theme'),
});

type FormValues = {
  pageSlug: string;
  themeId: string;
};

interface Props {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

function useSlugAvailability(slug: string): SlugAvailability {
  const [status, setStatus] = useState<SlugAvailability>('idle');

  useEffect(() => {
    if (!slug || !regexSlug.test(slug)) {
      setStatus('idle');
      return;
    }

    if (isForbiddenSlug(slug) || isReservedSlug(slug)) {
      setStatus('taken');
      return;
    }

    setStatus('checking');
    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        const { isAvailable } = await InternalApi.get(
          `/pages/internal/slug-availability?slug=${slug}`
        );
        if (!cancelled) setStatus(isAvailable ? 'available' : 'taken');
      } catch (err) {
        captureException(err);
        if (!cancelled) setStatus('error');
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [slug]);

  return status;
}

function WelcomeScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex w-full flex-col items-center justify-center bg-linear-to-br from-slate-50 via-white to-slate-100 p-6 text-center dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/logo.png"
        alt="Linky Logo"
        className="size-16 rounded-xl drop-shadow-lg md:size-24"
      />
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-balance text-slate-900 md:mt-6 md:text-3xl dark:text-slate-100">
        Welcome to <span className="text-primary">Linky</span>
      </h2>
      <p className="mt-2 max-w-md text-base text-pretty text-slate-500 md:text-lg dark:text-slate-400">
        Let's build your first page together. It only takes a minute.
      </p>
      <p className="mt-2 text-sm text-slate-400">Trusted by 3000+ creators.</p>
      <Button
        type="button"
        onClick={onNext}
        className="mt-6 w-full shadow-lg md:w-auto"
        size="xl"
      >
        Get started
      </Button>
    </div>
  );
}

function StepShell({
  eyebrow,
  title,
  description,
  preview,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  preview: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div className="flex w-full flex-col overflow-y-auto border-slate-200 md:w-1/2 md:border-r dark:border-slate-700">
        {/* my-auto centers short content without breaking scroll on tall content */}
        <div className="my-auto p-5 md:p-8">
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {eyebrow}
          </p>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-balance text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="mt-1.5 text-sm text-pretty text-slate-500 dark:text-slate-400">
            {description}
          </p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
      <div className="hidden w-1/2 md:flex">{preview}</div>
    </>
  );
}

function NewPageForm({
  currentStep,
  setCurrentStep,
  isFreshOnboarding,
  onClose,
}: {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isFreshOnboarding: boolean;
  onClose?: () => void;
}) {
  const { values, errors, isSubmitting, setFieldValue } =
    useFormikContext<FormValues>();
  const availability = useSlugAvailability(values.pageSlug);

  const totalSteps = isFreshOnboarding ? 3 : 2;
  const handleStepNumber = isFreshOnboarding ? 2 : 1;
  const themeStepNumber = isFreshOnboarding ? 3 : 2;

  const slugReady =
    !!values.pageSlug &&
    regexSlug.test(values.pageSlug) &&
    (availability === 'available' || availability === 'error');

  return (
    <Form className="flex h-[min(85svh,600px)] flex-col">
      <div className="flex min-h-0 flex-1">
        {currentStep === 1 && isFreshOnboarding && (
          <WelcomeScreen onNext={() => setCurrentStep(2)} />
        )}
        {currentStep === handleStepNumber && (
          <StepShell
            eyebrow={`Step ${handleStepNumber} of ${totalSteps}`}
            title="Claim your handle"
            description="This will be your page's home on the internet."
            preview={
              <PagePreview
                pageSlug={values.pageSlug}
                themeId={defaultThemeSeeds.Default.id}
              />
            }
          >
            <HandleStep availability={availability} error={errors.pageSlug} />
          </StepShell>
        )}
        {currentStep === themeStepNumber && (
          <StepShell
            eyebrow={`Step ${themeStepNumber} of ${totalSteps}`}
            title="Pick your look"
            description="Choose a starting theme — you can customize every detail later."
            preview={
              <PagePreview
                pageSlug={values.pageSlug}
                themeId={values.themeId}
              />
            }
          >
            <ThemeStep
              currentThemeId={values.themeId}
              setFieldValue={setFieldValue}
            />
          </StepShell>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3.5 md:px-6 dark:border-slate-700 dark:bg-slate-800/30">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <span
              key={index}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                index + 1 === currentStep
                  ? 'w-6 bg-slate-900 dark:bg-white'
                  : 'w-1.5 bg-slate-300 dark:bg-slate-600'
              )}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {currentStep === 1 && onClose && !isSubmitting && (
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          )}
          {currentStep > 1 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}
          {currentStep === handleStepNumber && (
            <Button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!slugReady || isSubmitting}
            >
              Continue
              <ArrowRight className="ml-2 size-4" />
            </Button>
          )}
          {currentStep === themeStepNumber && (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Create my page
            </Button>
          )}
        </div>
      </div>
    </Form>
  );
}

export function NewPageDialog({ open, onOpenChange, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const isFreshOnboarding = searchParams.get('freshOnboarding') === 'true';

  useEffect(() => {
    if (isFreshOnboarding) {
      setCurrentStep(1);
    }
  }, [isFreshOnboarding]);

  const onSubmit = async (
    values: FormValues,
    { setSubmitting, setFieldError }: FormikHelpers<FormValues>
  ) => {
    setSubmitting(true);
    try {
      const { error, slug } = await InternalApi.post('/pages', {
        slug: values.pageSlug,
        themeId: values.themeId,
      });

      if (error) {
        toast({
          variant: 'error',
          title: error.message,
          description: error.label,
        });
        if (error.field === 'slug' || error.field === 'pageSlug') {
          setFieldError('pageSlug', error.message);
          setCurrentStep(isFreshOnboarding ? 2 : 1);
        } else if (error.field === 'themeId') {
          setFieldError('themeId', error.message);
          setCurrentStep(isFreshOnboarding ? 3 : 2);
        }
        return;
      }

      if (slug) {
        router.push(`/e/${slug}`);
        toast({ title: 'Page created' });
        if (onClose) onClose();
      }
    } catch (err) {
      captureException(err);
      toast({
        variant: 'error',
        title: "We couldn't create your page",
        description: 'Sorry, this is on us, please try again later.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0! md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
        <DialogTitle className="sr-only">Create a new page</DialogTitle>
        <Formik<FormValues>
          initialValues={{
            pageSlug: '',
            themeId: defaultThemeSeeds.Default.id,
          }}
          validationSchema={FormSchema}
          onSubmit={onSubmit}
          validateOnMount={false}
          validateOnChange={true}
          validateOnBlur={true}
        >
          <NewPageForm
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            isFreshOnboarding={isFreshOnboarding}
            onClose={onClose}
          />
        </Formik>
      </DialogContent>
    </Dialog>
  );
}
