'use client';

import { updateGeneralPageSettings } from './actions';
import { generalPageSettingsSchema } from './shared';
import VerificationRequestDialog from '@/app/components/VerificationRequestDialog';
import { captureException } from '@sentry/nextjs';
import { InternalApi } from '@trylinky/common';
import * as Catalyst from '@trylinky/ui/catalyst';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useToast,
} from '@trylinky/ui';
import { Field as FormikField, Form, Formik, FormikHelpers } from 'formik';
import { withZodSchema } from 'formik-validator-zod';
import { Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export type FormValues = {
  pageSlug: string;
  metaTitle: string;
  published: boolean;
};

interface Props {
  initialValues: FormValues;
  pageId: string;
}

export function EditPageSettingsGeneral({ initialValues, pageId }: Props) {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  const onSubmit = async (
    values: FormValues,
    { setSubmitting, setFieldError }: FormikHelpers<FormValues>
  ) => {
    setSubmitting(true);

    try {
      const response = await updateGeneralPageSettings(
        values,
        params.slug as string
      );

      if (response?.error) {
        captureException(response.error);
        toast({
          variant: 'error',
          title: 'Something went wrong',
          description: response.error.message,
        });

        if (response.error.field) {
          setFieldError(response.error.field, response.error.message);
        }
        return;
      }

      if (response.data) {
        if (values.pageSlug !== params.slug) {
          router.push(`/${values.pageSlug}`);
        }
      }

      toast({
        title: 'Your page settings have been updated',
      });
      router.refresh();
    } catch (error) {
      captureException(error);
      toast({
        variant: 'error',
        title: 'Something went wrong',
        description: 'Sorry, there was an issue updating your page settings',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePage = async () => {
    try {
      const res = await InternalApi.delete(`/pages/${pageId}`);

      if (res?.error) {
        toast({
          variant: 'error',
          title: 'Something went wrong',
          description: res.error,
        });
        return;
      }

      toast({
        title: 'Your page has been deleted',
      });

      router.push('/');
    } catch (error) {
      captureException(error);
      toast({
        variant: 'error',
        title: 'Something went wrong',
        description: 'Sorry, there was an issue deleting your page',
      });
    }
  };

  return (
    <>
      <Formik
        initialValues={{
          pageSlug: initialValues.pageSlug,
          metaTitle: initialValues.metaTitle,
          published: initialValues.published,
        }}
        validate={withZodSchema(generalPageSettingsSchema)}
        onSubmit={onSubmit}
        enableReinitialize
      >
        {({ isSubmitting, values, setFieldValue, errors }) => (
          <Form className="flex w-full flex-col gap-12">
            {/* General */}
            <section className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
              <div className="md:col-span-1">
                <Catalyst.Subheading>General</Catalyst.Subheading>
                <Catalyst.Text className="mt-1">
                  Your page handle, title, and whether it&apos;s live.
                </Catalyst.Text>
              </div>

              <div className="md:col-span-2">
                <Catalyst.Fieldset>
                  <Catalyst.FieldGroup>
                    <Catalyst.Field>
                      <Catalyst.Label htmlFor="pageSlug">Handle</Catalyst.Label>
                      <div className="mt-3 flex">
                        <span className="inline-flex items-center rounded-l-lg border border-r-0 border-zinc-950/10 bg-zinc-50 px-3 text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                          lin.ky/
                        </span>
                        <FormikField name="pageSlug">
                          {({ field }: { field: { value: string } }) => (
                            <Catalyst.Input
                              {...field}
                              id="pageSlug"
                              placeholder="your-page"
                              className="flex-1 [&_input]:rounded-l-none"
                              invalid={!!errors.pageSlug}
                            />
                          )}
                        </FormikField>
                      </div>
                      {errors.pageSlug && (
                        <Catalyst.ErrorMessage className="mt-2">
                          {errors.pageSlug}
                        </Catalyst.ErrorMessage>
                      )}
                    </Catalyst.Field>

                    <Catalyst.Field>
                      <Catalyst.Label htmlFor="metaTitle">
                        Page title
                      </Catalyst.Label>
                      <FormikField name="metaTitle">
                        {({ field }: { field: { value: string } }) => (
                          <Catalyst.Input
                            {...field}
                            id="metaTitle"
                            placeholder="Hello world"
                            invalid={!!errors.metaTitle}
                          />
                        )}
                      </FormikField>
                      {errors.metaTitle && (
                        <Catalyst.ErrorMessage className="mt-2">
                          {errors.metaTitle}
                        </Catalyst.ErrorMessage>
                      )}
                    </Catalyst.Field>

                    <Catalyst.SwitchField>
                      <Catalyst.Label>Published</Catalyst.Label>
                      <Catalyst.Description>
                        Disabling this will turn your page into a draft and only
                        you will be able to see it.
                      </Catalyst.Description>
                      <Catalyst.Switch
                        name="published"
                        checked={values.published}
                        onChange={(newVal: boolean) =>
                          setFieldValue('published', newVal)
                        }
                      />
                    </Catalyst.SwitchField>
                  </Catalyst.FieldGroup>
                </Catalyst.Fieldset>

                <div className="mt-8">
                  <Catalyst.Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save settings
                  </Catalyst.Button>
                </div>
              </div>
            </section>

            <Catalyst.Divider />

            {/* Verification */}
            <section className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
              <div className="md:col-span-1">
                <Catalyst.Subheading>Verification</Catalyst.Subheading>
                <Catalyst.Text className="mt-1">
                  Verified pages are highlighted with a badge.
                </Catalyst.Text>
              </div>

              <div className="md:col-span-2">
                <Catalyst.Text>
                  Begin the verification process to request a verified badge for
                  your page.
                </Catalyst.Text>
                <Catalyst.Button
                  type="button"
                  outline
                  className="mt-4"
                  onClick={() => setShowVerificationDialog(true)}
                >
                  Begin page verification
                </Catalyst.Button>
              </div>
            </section>

            <Catalyst.Divider />

            {/* Danger zone */}
            <section className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
              <div className="md:col-span-1">
                <Catalyst.Subheading className="text-red-600 dark:text-red-500">
                  Danger zone
                </Catalyst.Subheading>
                <Catalyst.Text className="mt-1">
                  Irreversible actions for this page.
                </Catalyst.Text>
              </div>

              <div className="md:col-span-2">
                <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
                  <Catalyst.Subheading className="text-red-700 dark:text-red-400">
                    Delete this page
                  </Catalyst.Subheading>
                  <Catalyst.Text className="mt-1">
                    Deleting your page is irreversible and your page handle will
                    be available to use by other users.
                  </Catalyst.Text>
                  <Catalyst.Button
                    type="button"
                    color="red"
                    className="mt-4"
                    onClick={() => setShowConfirmDelete(true)}
                  >
                    Delete page
                  </Catalyst.Button>
                </div>
              </div>
            </section>
          </Form>
        )}
      </Formik>

      <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm delete</DialogTitle>
            <DialogDescription>
              Deleting your page is irreversible and your page username will be
              available to use by other users. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowConfirmDelete(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePage}>
              Delete Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VerificationRequestDialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
        pageId={pageId}
      />
    </>
  );
}
