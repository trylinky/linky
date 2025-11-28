import { EditFormProps } from '../types';
import { FormField } from '@/components/FormField';
import {
  WaitlistEmailBlockConfig,
  WaitlistEmailBlockSchema,
} from '@trylinky/blocks';
import { Button } from '@trylinky/ui';
import { Form, Formik, FormikHelpers } from 'formik';
import { Loader2 } from 'lucide-react';

export function EditForm({
  initialValues,
  onSave,
  onClose,
  blockId,
}: EditFormProps<WaitlistEmailBlockConfig>) {
  const onSubmit = async (
    values: WaitlistEmailBlockConfig,
    { setSubmitting }: FormikHelpers<WaitlistEmailBlockConfig>
  ) => {
    setSubmitting(true);
    onSave(values);
  };

  return (
    <Formik
      initialValues={{
        title: initialValues?.title ?? '',
        label: initialValues?.label ?? '',
        buttonLabel: initialValues?.buttonLabel ?? '',
        waitlistId: initialValues?.waitlistId ?? '',
      }}
      validationSchema={WaitlistEmailBlockSchema}
      onSubmit={onSubmit}
      enableReinitialize={true}
    >
      {({ isSubmitting, setFieldValue, errors }) => (
        <Form className="w-full flex flex-col gap-2">
          <FormField
            label="Title"
            name="title"
            id="title"
            error={errors.title}
          />
          <FormField
            label="Label"
            name="label"
            id="label"
            error={errors.label}
          />
          <FormField
            label="Button label"
            name="buttonLabel"
            id="buttonLabel"
            error={errors.buttonLabel}
          />
          <FormField
            label="Waitlist ID"
            name="waitlistId"
            id="waitlistId"
            error={errors.waitlistId}
          />
          <span className="text-xs text-black/70 -mt-2 mb-3">
            You can find this in your settings on getwaitlist.com
          </span>

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
