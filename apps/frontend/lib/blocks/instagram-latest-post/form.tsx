import { EditFormProps } from '../types';
import { BlockIntegrationUI } from '@/app/components/BlockIntegrationUI';
import { FormField } from '@/components/FormField';
import {
  InstagramLatestPostBlockConfig,
  InstagramLatestPostSchema,
} from '@trylinky/blocks';
import { Button } from '@trylinky/ui';
import { Form, Formik, FormikHelpers } from 'formik';
import { Loader2 } from 'lucide-react';

export function EditForm({
  initialValues,
  onSave,
  onClose,
  integration,
  blockId,
}: EditFormProps<InstagramLatestPostBlockConfig>) {
  const onSubmit = async (
    values: InstagramLatestPostBlockConfig,
    { setSubmitting }: FormikHelpers<InstagramLatestPostBlockConfig>
  ) => {
    setSubmitting(true);
    onSave(values);
  };

  return (
    <>
      <BlockIntegrationUI
        blockId={blockId}
        integration={integration}
        integrationType="instagram"
      />

      {!integration && (
        <div className="bg-stone-100 rounded-md flex flex-col items-center text-center px-4 py-8 mt-4">
          <span className="text-sm text-stone-600 text-pretty">
            Please note that due to a recent change in Instagram&apos;s API, you
            can only connect your Instagram account if it is a Business or
            Creator account.
          </span>
        </div>
      )}

      {integration && (
        <Formik
          initialValues={{
            numberOfPosts: initialValues?.numberOfPosts ?? 1,
          }}
          validationSchema={InstagramLatestPostSchema}
          onSubmit={onSubmit}
          enableReinitialize={true}
        >
          {({ isSubmitting, errors }) => {
            return (
              <Form className="w-full flex flex-col gap-2 mt-4">
                <FormField
                  type="number"
                  label="Number of posts to show"
                  name="numberOfPosts"
                  id="numberOfPosts"
                  error={errors.numberOfPosts}
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
            );
          }}
        </Formik>
      )}
    </>
  );
}
