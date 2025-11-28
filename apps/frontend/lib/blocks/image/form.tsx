import { EditFormProps } from '../types';
import { FormFileUpload } from '@/components/FormFileUpload';
import { ImageBlockConfig, ImageSchema } from '@trylinky/blocks';
import { Button } from '@trylinky/ui';
import { Form, Formik, FormikHelpers } from 'formik';
import { Loader2 } from 'lucide-react';

export function EditForm({
  initialValues,
  onSave,
  onClose,
  blockId,
}: EditFormProps<ImageBlockConfig>) {
  const onSubmit = async (
    values: ImageBlockConfig,
    { setSubmitting }: FormikHelpers<ImageBlockConfig>
  ) => {
    setSubmitting(true);
    onSave(values);
  };

  return (
    <Formik
      initialValues={{
        src: initialValues?.src ?? '',
      }}
      validationSchema={ImageSchema}
      onSubmit={onSubmit}
      enableReinitialize={true}
    >
      {({ isSubmitting, setValues, errors }) => (
        <Form className="w-full flex flex-col">
          <FormFileUpload
            htmlFor="image-src"
            onUploaded={(url) => setValues({ src: url })}
            initialValue={initialValues?.src}
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
