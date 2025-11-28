'use client';

import { HandleStep } from './HandleStep';
import { PagePreview } from './PagePreview';
import { ThemeStep } from './ThemeStep';
import { regexSlug } from '@/lib/slugs';
import { defaultThemeSeeds } from '@/lib/theme';
import { captureException } from '@sentry/nextjs';
import { InternalApi } from '@trylinky/common';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  useToast,
} from '@trylinky/ui';
import { Formik, Form, FormikHelpers } from 'formik';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import * as Yup from 'yup';

const FormSchema = Yup.object().shape({
  pageSlug: Yup.string()
    .trim()
    .required('Please provide a page slug')
    .matches(
      regexSlug,
      'Please only use lowercase letters, numbers, dashes and underscores'
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

function WelcomeScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="w-full p-4 md:p-6 flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 rounded-lg shadow-md transition-all">
      <div className="flex flex-col items-center justify-center h-full text-center">
        {/* Logo Illustration */}
        <img
          src="/assets/logo.png"
          alt="Linky Logo"
          className="mb-4 md:mb-6 w-16 h-16 md:w-24 md:h-24 drop-shadow-lg animate-fade-in rounded-xl"
        />
        {/* Heading */}
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          Welcome to <span className="text-primary">Linky</span>
        </h2>
        {/* Subtitle */}
        <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 mt-2 max-w-md">
          Let's get started with building your first page. We'll guide you
          through the process step by step.
        </p>
        {/* Value Proposition */}
        <p className="text-xs md:text-sm text-slate-400 mt-2">
          Trusted by 3000+ creators
        </p>
        {/* Get Started Button */}
        <Button
          type="button"
          onClick={onNext}
          className="mt-4 md:mt-6 shadow-lg w-full md:w-auto"
          size="xl"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}

function HandleScreen({
  error,
  touched,
  pageSlug,
  onNext,
}: {
  error?: string;
  touched?: boolean;
  pageSlug: string;
  onNext: () => void;
}) {
  return (
    <>
      <div className="w-full md:w-1/2 p-4 md:p-6 flex flex-col border-r border-slate-200 dark:border-slate-700">
        <div className="mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Choose your page handle
          </h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
            This will be your page's unique web address on lin.ky.
          </p>
        </div>
        <div className="flex-grow">
          <HandleStep error={error} touched={touched} />
        </div>
      </div>
      <div className="hidden md:flex w-1/2 flex-col items-center justify-center bg-slate-100 dark:bg-slate-900">
        <PagePreview
          pageSlug={pageSlug}
          themeId={defaultThemeSeeds.Default.id}
          currentStep={1}
        />
      </div>
    </>
  );
}

function ThemeScreen({
  currentThemeId,
  setFieldValue,
  pageSlug,
}: {
  currentThemeId: string;
  setFieldValue: (field: string, value: any) => void;
  pageSlug: string;
}) {
  return (
    <>
      <div className="w-full md:w-1/2 p-4 md:p-6 flex flex-col border-r border-slate-200 dark:border-slate-700">
        <div className="mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Select a theme
          </h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
            Pick a visual style that best represents your page.
          </p>
        </div>
        <div className="flex-grow">
          <ThemeStep
            currentThemeId={currentThemeId}
            setFieldValue={setFieldValue}
          />
        </div>
      </div>
      <div className="hidden md:flex w-1/2 flex-col items-center justify-center bg-slate-100 dark:bg-slate-900">
        <PagePreview
          pageSlug={pageSlug}
          themeId={currentThemeId}
          currentStep={2}
        />
      </div>
    </>
  );
}

export function NewPageDialog({ open, onOpenChange, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const isFreshOnboarding = searchParams.get('freshOnboarding') === 'true';

  const totalSteps = isFreshOnboarding ? 3 : 2;

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
        router.push(`/${slug}`);
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
      <DialogContent className="md:max-w-2xl lg:max-w-3xl xl:max-w-4xl !p-0 min-h-[550px]">
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
          {({
            isSubmitting,
            values,
            errors,
            touched,
            setFieldValue,
            validateForm,
            dirty,
            setFieldError,
          }) => (
            <Form className="flex flex-col h-full">
              <div className="flex flex-1">
                {currentStep === 1 && isFreshOnboarding && (
                  <WelcomeScreen onNext={() => setCurrentStep(2)} />
                )}
                {currentStep === (isFreshOnboarding ? 2 : 1) && (
                  <HandleScreen
                    error={errors.pageSlug}
                    touched={touched.pageSlug}
                    pageSlug={values.pageSlug}
                    onNext={async () => {
                      const formErrors = await validateForm();
                      if (formErrors.pageSlug || !values.pageSlug) {
                        if (!values.pageSlug)
                          setFieldValue('pageSlug', '', true);
                      } else {
                        setCurrentStep(currentStep + 1);
                      }
                    }}
                  />
                )}
                {currentStep === (isFreshOnboarding ? 3 : 2) && (
                  <ThemeScreen
                    currentThemeId={values.themeId}
                    setFieldValue={setFieldValue}
                    pageSlug={values.pageSlug}
                  />
                )}
              </div>

              {/* Footer: Navigation */}
              <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 flex justify-between items-center">
                <div>
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(currentStep - 1)}
                      disabled={isSubmitting}
                    >
                      Back
                    </Button>
                  )}
                  {currentStep === 1 && onClose && !isSubmitting && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onClose}
                      className="ml-auto mr-2 md:hidden"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  {currentStep === 1 && onClose && !isSubmitting && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onClose}
                      className="hidden md:inline-flex"
                    >
                      Cancel
                    </Button>
                  )}
                  {currentStep < totalSteps &&
                    !(currentStep === 1 && isFreshOnboarding) && (
                      <Button
                        type="button"
                        onClick={async () => {
                          const formErrors = await validateForm();
                          if (
                            currentStep === (isFreshOnboarding ? 2 : 1) &&
                            (formErrors.pageSlug || !values.pageSlug)
                          ) {
                            if (!values.pageSlug)
                              setFieldValue('pageSlug', '', true);
                          } else if (
                            currentStep === (isFreshOnboarding ? 2 : 1)
                          ) {
                            // Check slug availability before proceeding
                            try {
                              const { isAvailable } = await InternalApi.get(
                                `/pages/internal/slug-availability?slug=${values.pageSlug}`
                              );
                              if (!isAvailable) {
                                toast({
                                  variant: 'error',
                                  title: 'Slug not available',
                                  description:
                                    'This handle is already taken. Please choose a different one.',
                                });
                                setFieldError(
                                  'pageSlug',
                                  'This handle is already taken'
                                );
                                return;
                              }
                              setCurrentStep(currentStep + 1);
                            } catch (err) {
                              captureException(err);
                              toast({
                                variant: 'error',
                                title: 'Error checking slug availability',
                                description: 'Please try again later.',
                              });
                            }
                          } else if (
                            currentStep === (isFreshOnboarding ? 3 : 2) &&
                            formErrors.themeId
                          ) {
                            // Handle theme errors if any specific validation is needed before submit
                          } else if (
                            currentStep === (isFreshOnboarding ? 3 : 2)
                          ) {
                            setCurrentStep(currentStep + 1);
                          }
                        }}
                        disabled={
                          isSubmitting ||
                          (currentStep === (isFreshOnboarding ? 2 : 1) &&
                            (!values.pageSlug || !!errors.pageSlug))
                        }
                      >
                        Next
                      </Button>
                    )}
                  {currentStep === totalSteps && (
                    <Button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        (!dirty && Object.keys(errors).length === 0)
                      }
                    >
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Page
                    </Button>
                  )}
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}
