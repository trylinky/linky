'use client';

import { FormField } from '../FormField';
import { updateGeneralPageSettings } from './actions';
import { generalPageSettingsSchema } from './shared';
import VerificationRequestDialog from '@/app/components/VerificationRequestDialog';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { captureException } from '@sentry/nextjs';
import { InternalApi } from '@trylinky/common';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Switch,
  useToast,
} from '@trylinky/ui';
import { Form, Formik, FormikHelpers } from 'formik';
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
          <Form className="w-full flex flex-col">
            <div className="border-b border-white/10 pb-12">
              <div>
                <FormField
                  withPrefix="lin.ky/"
                  label="Handle"
                  name="pageSlug"
                  placeholder="your-page"
                  id="pageSlug"
                  error={errors.pageSlug}
                />
                <div className="hidden px-3 py-4 rounded-lg ring-1 ring-black/10 relative bg-[#fffbec] flex flex-col gap-1">
                  <span className="text-sm text-black font-semibold">
                    Custom Domain 👀
                  </span>
                  <span className="text-sm text-black">
                    Add a custom domain to your page for a one-time fee of{' '}
                    <del>$10</del> <ins className="font-semibold">$5</ins>. This
                    feature is still in beta, and you can enable it by reaching
                    out to us at <a href="mailto:team@lin.ky">team@lin.ky</a>.
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <FormField
                  label="Page title"
                  name="metaTitle"
                  placeholder="Hello world"
                  id="metaTitle"
                  error={errors.metaTitle}
                />
              </div>

              <div className="mt-4">
                <Label htmlFor="published">Published</Label>
                <div className="flex flex-col md:flex-row items-center mt-3">
                  <Switch
                    id="published"
                    checked={values.published}
                    onCheckedChange={(newVal) =>
                      setFieldValue('published', newVal)
                    }
                  />
                  <label className="text-sm mt-3 md:mt-0 md:ml-3 max-w-80">
                    Disabling this will turn your page into a draft and only you
                    will be able to see it.
                  </label>
                </div>
              </div>

              <Collapsible className="mt-4 group">
                <CollapsibleTrigger className="w-full py-2 px-3 bg-stone-100 rounded-lg">
                  <div className="flex justify-between items-center w-full">
                    <span className="font-semibold">Page Verification</span>
                    <ChevronDownIcon className="w-4 h-4 group-data-[state=open]:rotate-180" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 py-2 bg-stone-100 rounded-lg">
                  <span className="text-sm mt-1 block">
                    Verified pages are highlighted with a badge. Click below to
                    begin the verification process.
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowVerificationDialog(true)}
                  >
                    Begin Page Verification
                  </Button>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible className="mt-4 group">
                <CollapsibleTrigger className="w-full py-2 px-3 bg-stone-100 rounded-lg">
                  <div className="flex justify-between items-center w-full">
                    <span className="font-semibold">Deleting your page</span>
                    <ChevronDownIcon className="w-4 h-4 group-data-[state=open]:rotate-180" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 py-2 bg-stone-100 rounded-lg">
                  <span className="text-sm mt-1 block">
                    Deleting your page is irreversible and your page handle will
                    be available to use by other users.
                  </span>

                  <Button
                    type="button"
                    variant="destructive"
                    className="mt-4"
                    onClick={() => setShowConfirmDelete(true)}
                  >
                    Delete Page
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            </div>

            <DialogFooter>
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
