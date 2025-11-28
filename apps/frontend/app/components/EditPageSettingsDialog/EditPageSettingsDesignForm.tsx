'use client';

import { FormField } from '../FormField';
import { FormFileUpload } from '../FormFileUpload';
import { updateDesignPageSettings } from './actions';
import { designPageSettingsSchema } from './shared';
import { CreateEditThemeForm } from '@/app/components/EditPageSettingsDialog/CreateNewTheme';
import { PlusIcon } from '@heroicons/react/20/solid';
import { captureException } from '@sentry/nextjs';
import { internalApiFetcher } from '@trylinky/common';
import { Theme } from '@trylinky/prisma';
import { Button, DialogFooter, useToast } from '@trylinky/ui';
import { Form, Formik, FormikHelpers } from 'formik';
import { withZodSchema } from 'formik-validator-zod';
import { Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import useSWR from 'swr';

export type FormValues = {
  themeId: string;
  backgroundImage: string;
};

interface Props {
  initialValues: FormValues;
  pageId: string;
}

export function EditPageSettingsDesign({ initialValues, pageId }: Props) {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [showCreateNewTheme, setShowCreateNewTheme] = useState(false);
  const [showEditTheme, setShowEditTheme] = useState(false);

  const { data: currentTeamThemes } = useSWR<Theme[]>(
    '/themes/me/team',
    internalApiFetcher
  );

  const onSubmit = async (
    values: FormValues,
    { setSubmitting }: FormikHelpers<FormValues>
  ) => {
    setSubmitting(true);

    try {
      const response = await updateDesignPageSettings(
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

  return (
    <Formik
      initialValues={{
        themeId: initialValues.themeId,
        backgroundImage: initialValues.backgroundImage,
      }}
      validate={withZodSchema(designPageSettingsSchema)}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ isSubmitting, values, setFieldValue, errors }) => {
        const currentSelectedTheme = currentTeamThemes?.find(
          (theme) => theme.id === values.themeId
        );

        const isSelectedThemeCustom = currentSelectedTheme?.isDefault === false;

        return (
          <Form className="w-full flex flex-col">
            <div className="border-b border-white/10 pb-12">
              <div className="mt-4">
                <FormField
                  fieldType="select"
                  label="Page theme"
                  labelDetail={
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-sm text-indigo-600 hover:bg-transparent px-0 items-center flex"
                      onClick={() => {
                        setShowCreateNewTheme(true);
                        setShowEditTheme(false);
                      }}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      New theme
                    </Button>
                  }
                  name="themeId"
                  placeholder=""
                  id="themeId"
                  error={errors.themeId}
                >
                  {currentTeamThemes?.map((theme) => {
                    return (
                      <option value={theme.id} key={theme.id}>
                        {theme.name}
                      </option>
                    );
                  })}
                </FormField>
                {isSelectedThemeCustom && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-sm text-indigo-600 px-0"
                    onClick={() => {
                      setShowCreateNewTheme(false);
                      setShowEditTheme(true);
                    }}
                  >
                    Edit theme
                  </Button>
                )}
              </div>

              {showCreateNewTheme && !showEditTheme && (
                <section className="px-4 py-4 bg-stone-100 rounded-lg mt-4">
                  <CreateEditThemeForm
                    action="create"
                    onCreateSuccess={(newThemeId) => {
                      setShowCreateNewTheme(false);
                      setShowEditTheme(true);
                      setFieldValue('themeId', newThemeId);
                    }}
                  />
                </section>
              )}

              {showEditTheme &&
                !showCreateNewTheme &&
                isSelectedThemeCustom && (
                  <section className="px-4 py-4 bg-stone-100 rounded-lg mt-4">
                    <CreateEditThemeForm
                      action="edit"
                      editThemeId={values.themeId}
                    />
                  </section>
                )}

              <div className="mt-4">
                <FormFileUpload
                  htmlFor="page-background-image"
                  onUploaded={(url) => setFieldValue('backgroundImage', url)}
                  initialValue={initialValues?.backgroundImage}
                  referenceId={pageId}
                  label="Background image"
                  assetContext="pageBackgroundImage"
                  isCondensed
                />
              </div>
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
        );
      }}
    </Formik>
  );
}
