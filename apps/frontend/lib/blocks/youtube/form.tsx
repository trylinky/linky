import { EditFormProps } from '../types';
import { FormField } from '@/components/FormField';
import { YouTubeBlockConfig, YouTubeBlockSchema } from '@trylinky/blocks';
import { Button } from '@trylinky/ui';
import { Form, Formik, FormikHelpers } from 'formik';
import { Loader2 } from 'lucide-react';

export function EditForm({
  initialValues,
  onSave,
  onClose,
}: EditFormProps<YouTubeBlockConfig>) {
  const onSubmit = async (
    values: YouTubeBlockConfig,
    { setSubmitting }: FormikHelpers<YouTubeBlockConfig>
  ) => {
    setSubmitting(true);
    onSave(values);
  };

  return (
    <Formik
      initialValues={{
        videoId: initialValues?.videoId ?? '',
      }}
      validationSchema={YouTubeBlockSchema}
      onSubmit={onSubmit}
      enableReinitialize={true}
    >
      {({ isSubmitting, errors }) => (
        <Form className="w-full flex flex-col gap-2">
          <FormField
            label="Video ID"
            name="videoId"
            id="videoId"
            error={errors.videoId}
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
