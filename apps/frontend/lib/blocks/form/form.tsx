import { EditFormProps } from '../types';
import { FormField } from '@/components/FormField';
import {
  FormBlockConfig,
  FormBlockField,
  FormBlockSchema,
  MAX_FORM_FIELDS,
  formBlockDefaults,
  formFieldTypes,
} from '@trylinky/blocks';
import { Button, cn } from '@trylinky/ui';
import {
  Field,
  FieldArray,
  Form,
  Formik,
  FormikHelpers,
  useFormikContext,
} from 'formik';
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from 'lucide-react';
import { ChangeEvent, useState } from 'react';

const fieldTypeLabels: Record<(typeof formFieldTypes)[number], string> = {
  text: 'Text',
  email: 'Email',
  textarea: 'Long text',
  select: 'Dropdown',
  checkbox: 'Checkbox',
};

const newField = (): FormBlockField => ({
  id:
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `field-${Math.random().toString(36).slice(2, 10)}`,
  type: 'text',
  label: '',
  required: false,
});

export function EditForm({
  initialValues,
  onSave,
  onClose,
}: EditFormProps<FormBlockConfig>) {
  const handleSubmit = async (
    values: FormBlockConfig,
    { setSubmitting }: FormikHelpers<FormBlockConfig>
  ) => {
    setSubmitting(true);
    onSave(values);
  };

  return (
    <Formik<FormBlockConfig>
      initialValues={{
        title: initialValues?.title ?? formBlockDefaults.title,
        submitLabel:
          initialValues?.submitLabel ?? formBlockDefaults.submitLabel,
        successMessage:
          initialValues?.successMessage ?? formBlockDefaults.successMessage,
        fields: initialValues?.fields ?? formBlockDefaults.fields,
      }}
      validationSchema={FormBlockSchema}
      onSubmit={handleSubmit}
      enableReinitialize={true}
    >
      {({ isSubmitting, errors }) => (
        <Form className="flex w-full flex-col gap-3">
          <FormField
            label="Title"
            name="title"
            id="title"
            error={typeof errors.title === 'string' ? errors.title : undefined}
          />

          <FieldList />

          <FormField
            label="Submit button label"
            name="submitLabel"
            id="submitLabel"
            error={
              typeof errors.submitLabel === 'string'
                ? errors.submitLabel
                : undefined
            }
          />

          <FormField
            label="Success message"
            name="successMessage"
            id="successMessage"
            error={
              typeof errors.successMessage === 'string'
                ? errors.successMessage
                : undefined
            }
          />

          <div className="flex shrink-0 justify-between border-t border-stone-200 py-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              ← Cancel
            </Button>
            <Button type="submit">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

const fieldInputClasses =
  'rounded-md border border-stone-200 px-2 py-1.5 text-sm text-stone-800 placeholder:text-stone-400';

const OptionsEditor = ({
  options,
  onCommit,
}: {
  options: string[];
  onCommit: (options: string[]) => void;
}) => {
  const [raw, setRaw] = useState((options ?? []).join('\n'));

  return (
    <textarea
      value={raw}
      onChange={(event) => setRaw(event.target.value)}
      onBlur={(event) =>
        onCommit(
          event.target.value
            .split('\n')
            .map((option) => option.trim())
            .filter(Boolean)
        )
      }
      placeholder={'One option per line\ne.g.\nSupport\nSales'}
      rows={3}
      className={fieldInputClasses}
    />
  );
};

const FieldList = () => {
  const { values, errors, setFieldValue } =
    useFormikContext<FormBlockConfig>();

  return (
    <FieldArray name="fields">
      {({ push, remove, swap }) => (
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-stone-700">Fields</span>

          {values.fields.map((field, index) => {
            const rowErrors = Array.isArray(errors.fields)
              ? (errors.fields[index] as
                  | { label?: string; options?: string }
                  | string
                  | undefined)
              : undefined;

            return (
            <div
              key={field.id}
              className="flex flex-col gap-2 rounded-lg border border-stone-200 p-3"
            >
              <div className="flex items-center gap-2">
                <Field
                  name={`fields.${index}.label`}
                  placeholder="Field label"
                  className={cn(fieldInputClasses, 'flex-1')}
                />
                <Field
                  as="select"
                  name={`fields.${index}.type`}
                  className={fieldInputClasses}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                    const nextType = event.target.value;
                    setFieldValue(`fields.${index}.type`, nextType);
                    if (nextType !== 'select') {
                      setFieldValue(`fields.${index}.options`, undefined);
                    }
                  }}
                >
                  {formFieldTypes.map((type) => (
                    <option key={type} value={type}>
                      {fieldTypeLabels[type]}
                    </option>
                  ))}
                </Field>

                <button
                  type="button"
                  aria-label="Move field up"
                  disabled={index === 0}
                  onClick={() => swap(index, index - 1)}
                  className="rounded p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Move field down"
                  disabled={index === values.fields.length - 1}
                  onClick={() => swap(index, index + 1)}
                  className="rounded p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Remove field"
                  disabled={values.fields.length === 1}
                  onClick={() => remove(index)}
                  className="rounded p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {field.type !== 'checkbox' && (
                <Field
                  name={`fields.${index}.placeholder`}
                  placeholder="Placeholder (optional)"
                  className={fieldInputClasses}
                />
              )}

              <label className="flex items-center gap-2 text-sm text-stone-600">
                <Field type="checkbox" name={`fields.${index}.required`} />
                Required
              </label>

              {field.type === 'select' && (
                <OptionsEditor
                  key={`${field.id}-options`}
                  options={field.options ?? []}
                  onCommit={(options) =>
                    setFieldValue(`fields.${index}.options`, options)
                  }
                />
              )}

              {typeof rowErrors === 'object' && rowErrors?.label && (
                <p className="text-xs text-red-600">{rowErrors.label}</p>
              )}
              {typeof rowErrors === 'object' && rowErrors?.options && (
                <p className="text-xs text-red-600">{rowErrors.options}</p>
              )}
            </div>
            );
          })}

          {typeof errors.fields === 'string' && (
            <p className="text-sm text-red-600">{errors.fields}</p>
          )}

          {values.fields.length < MAX_FORM_FIELDS && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => push(newField())}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add field
            </Button>
          )}

          <p className="text-xs text-stone-500">
            Removing a field doesn&apos;t delete answers already collected for
            it — they stay visible in your responses.
          </p>
        </div>
      )}
    </FieldArray>
  );
};
