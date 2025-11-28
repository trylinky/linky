import { EditFormProps } from '../types';
import { FormField } from '@/components/FormField';
import { ContentBlockConfig, ContentSchema } from '@trylinky/blocks';
import { Button } from '@trylinky/ui';
import { Form, Formik, FormikHelpers } from 'formik';
import { Loader2 } from 'lucide-react';

export function EditForm({
  initialValues,
  onSave,
  onClose,
}: EditFormProps<ContentBlockConfig>) {
  const onSubmit = async (
    values: ContentBlockConfig,
    { setSubmitting }: FormikHelpers<ContentBlockConfig>
  ) => {
    setSubmitting(true);
    onSave(values);
  };

  return (
    <Formik
      initialValues={{
        title: initialValues?.title ?? '',
        content: initialValues?.content ?? '',
      }}
      validationSchema={ContentSchema}
      onSubmit={onSubmit}
      enableReinitialize={true}
    >
      {({ isSubmitting, errors }) => (
        <Form className="w-full flex flex-col gap-2">
          <FormField
            label="Title"
            name="title"
            id="title"
            placeholder="A title"
            error={errors.title}
          />
          <FormField
            label="Content"
            name="content"
            id="content"
            placeholder="Some content"
            error={errors.content}
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
