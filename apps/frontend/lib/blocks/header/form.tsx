import { EditFormProps } from '../types';
import { FormField } from '@/app/components/FormField';
import { FormFileUpload } from '@/components/FormFileUpload';
import { HeaderBlockConfig, HeaderSchema } from '@trylinky/blocks';
import { internalApiFetcher } from '@trylinky/common';
import { Page } from '@trylinky/prisma';
import {
  Button,
  Checkbox,
  Label,
  RadioGroup,
  RadioGroupItem,
} from '@trylinky/ui';
import { Form, Formik, FormikHelpers } from 'formik';
import { Loader2 } from 'lucide-react';
import useSWR, { useSWRConfig } from 'swr';

export function EditForm({
  initialValues,
  onSave,
  onClose,
  blockId,
}: EditFormProps<HeaderBlockConfig>) {
  const { cache } = useSWRConfig();

  const pageId = cache.get('pageId');

  const { data: pageSettings } = useSWR<Partial<Page>>(
    `/pages/${pageId}/settings`,
    internalApiFetcher
  );

  const onSubmit = async (
    values: HeaderBlockConfig,
    { setSubmitting }: FormikHelpers<HeaderBlockConfig>
  ) => {
    setSubmitting(true);
    onSave(values);
  };

  return (
    <Formik
      initialValues={{
        title: initialValues?.title ?? '',
        description: initialValues?.description ?? '',
        avatar: {
          src: initialValues?.avatar?.src ?? '',
        },
        alignment: initialValues?.alignment ?? 'left',
        showVerifiedBadge: initialValues?.showVerifiedBadge ?? false,
        verifiedPageTitle: initialValues?.verifiedPageTitle ?? '',
      }}
      validationSchema={HeaderSchema}
      onSubmit={onSubmit}
      enableReinitialize={true}
    >
      {({ isSubmitting, setFieldValue, errors, values }) => (
        <Form className="w-full flex flex-col gap-2">
          {values.showVerifiedBadge ? (
            <FormField
              label="Title"
              name="verifiedPageTitle"
              id="verifiedPageTitle"
              error={errors.verifiedPageTitle}
              disabled
            />
          ) : (
            <FormField
              label="Title"
              name="title"
              id="title"
              error={errors.title}
            />
          )}

          {pageSettings?.verifiedAt && (
            <div className="flex items-start space-x-2 my-4">
              <Checkbox
                onCheckedChange={(checked: boolean) =>
                  setFieldValue('showVerifiedBadge', checked)
                }
                checked={values.showVerifiedBadge}
                id="showVerifiedBadge"
              />
              <div className="flex flex-col gap-1">
                <Label htmlFor="showVerifiedBadge">Show verified badge</Label>
                <span className="text-sm text-stone-500">
                  Your page has been verified by Linky. You can choose to show
                  this badge on your page.
                </span>
              </div>
            </div>
          )}

          <Label htmlFor="alignment">Alignment</Label>
          <RadioGroup
            defaultValue={values.alignment}
            onValueChange={(value: string) => setFieldValue('alignment', value)}
          >
            {['left', 'center', 'right'].map((alignment) => (
              <div className="flex items-center space-x-2" key={alignment}>
                <RadioGroupItem value={alignment} id={alignment} />
                <Label htmlFor={alignment}>
                  {alignment.charAt(0).toUpperCase() + alignment.slice(1)}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <FormField
            label="Subtitle"
            name="description"
            id="description"
            error={errors.description}
            isTextArea
            fieldType="textarea"
          />

          <FormFileUpload
            htmlFor="header-avatar"
            onUploaded={(url) => setFieldValue('avatar.src', url)}
            initialValue={initialValues?.avatar?.src}
            referenceId={blockId}
            assetContext="blockAsset"
          />

          <div className="flex flex-shrink-0 justify-between py-4 border-t border-stone-200">
            <Button type="button" variant="secondary" onClick={onClose}>
              ← Cancel
            </Button>
            <Button type="submit">
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
