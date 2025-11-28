'use client';

import { FormField } from '../FormField';
import { updateGeneralTeamSettings } from './actions';
import { generalTeamSettingsSchema } from './shared';
import { captureException } from '@sentry/nextjs';
import { Button, DialogFooter, useToast } from '@trylinky/ui';
import { Form, Formik, FormikHelpers } from 'formik';
import { withZodSchema } from 'formik-validator-zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export type FormValues = {
  name: string;
};

interface Props {
  onCancel: () => void;
  initialValues: FormValues;
}

export function EditTeamSettingsGeneral({ onCancel, initialValues }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const onSubmit = async (
    values: FormValues,
    { setSubmitting, setFieldError }: FormikHelpers<FormValues>
  ) => {
    setSubmitting(true);

    try {
      const response = await updateGeneralTeamSettings(values);

      if (response?.error) {
        toast({
          variant: 'error',
          title: 'Something went wrong',
          description: response.error.message,
        });

        return;
      }

      toast({
        title: 'Your team settings have been updated',
      });
      router.refresh();
      onCancel();
    } catch (error) {
      captureException(error);
      toast({
        variant: 'error',
        title: 'Something went wrong',
        description: 'Sorry, there was an issue updating your team settings',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={{
        name: initialValues.name,
      }}
      validate={withZodSchema(generalTeamSettingsSchema)}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ isSubmitting, values, setFieldValue, errors }) => (
        <Form className="w-full flex flex-col">
          <div className="border-b border-white/10 pb-12">
            <div>
              <FormField
                label="Team name"
                name="name"
                placeholder="Your team name"
                id="name"
                error={errors.name}
              />
            </div>
          </div>

          <DialogFooter>
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>
                ← Cancel
              </Button>
            )}
            <Button type="submit">
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Settings
            </Button>
          </DialogFooter>
        </Form>
      )}
    </Formik>
  );
}
