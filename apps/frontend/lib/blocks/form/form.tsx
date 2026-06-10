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
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2, X } from 'lucide-react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

const MAX_SELECT_OPTIONS = 20;

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

const inputClasses =
  'rounded-lg border-0 bg-white px-3 py-1.5 text-sm text-zinc-900 ring-1 ring-zinc-950/10 ring-inset placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-400 focus:outline-none';

const iconButtonClasses =
  'grid size-8 shrink-0 place-items-center rounded-md text-zinc-400 hover:bg-zinc-950/5 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400';

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
        <Form className="flex w-full flex-col gap-6">
          <FormField
            label="Title"
            name="title"
            id="title"
            error={typeof errors.title === 'string' ? errors.title : undefined}
          />

          <FieldList />

          <section className="flex flex-col gap-3 border-t border-zinc-950/5 pt-5">
            <h3 className="text-sm font-semibold text-zinc-950">
              After submit
            </h3>

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
          </section>

          <div className="flex items-center justify-between border-t border-zinc-950/10 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

const FieldList = () => {
  const { values, errors, setFieldValue } =
    useFormikContext<FormBlockConfig>();

  return (
    <FieldArray name="fields">
      {({ push, remove, swap }) => (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-zinc-950">Fields</h3>
            <p className="text-sm tracking-normal text-zinc-500">
              {values.fields.length} of {MAX_FORM_FIELDS}
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl bg-zinc-100/80 p-2">
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
                  className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-xs ring-1 ring-zinc-950/5"
                >
                  <div className="flex items-center gap-2">
                    <Field
                      name={`fields.${index}.label`}
                      placeholder="Field label"
                      aria-label="Field label"
                      className={cn(
                        inputClasses,
                        'min-w-0 flex-1 font-medium placeholder:font-normal'
                      )}
                    />

                    <span className="inline-grid shrink-0 grid-cols-[1fr_--spacing(8)]">
                      <Field
                        as="select"
                        name={`fields.${index}.type`}
                        aria-label="Field type"
                        className={cn(
                          inputClasses,
                          'col-span-full row-start-1 appearance-none bg-none pr-8'
                        )}
                        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                          const nextType = event.target.value;
                          setFieldValue(`fields.${index}.type`, nextType);
                          if (nextType !== 'select') {
                            setFieldValue(
                              `fields.${index}.options`,
                              undefined
                            );
                          }
                        }}
                      >
                        {formFieldTypes.map((type) => (
                          <option key={type} value={type}>
                            {fieldTypeLabels[type]}
                          </option>
                        ))}
                      </Field>
                      <svg
                        viewBox="0 0 8 5"
                        width="8"
                        height="5"
                        fill="none"
                        className="pointer-events-none col-start-2 row-start-1 place-self-center text-zinc-500"
                      >
                        <path d="M.5.5 4 4 7.5.5" stroke="currentcolor" />
                      </svg>
                    </span>

                    <div className="flex items-center">
                      <button
                        type="button"
                        aria-label="Move field up"
                        disabled={index === 0}
                        onClick={() => swap(index, index - 1)}
                        className={iconButtonClasses}
                      >
                        <ChevronUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Move field down"
                        disabled={index === values.fields.length - 1}
                        onClick={() => swap(index, index + 1)}
                        className={iconButtonClasses}
                      >
                        <ChevronDown className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Remove field"
                        disabled={values.fields.length === 1}
                        onClick={() => remove(index)}
                        className={cn(iconButtonClasses, 'hover:text-red-600')}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  {field.type !== 'checkbox' && (
                    <Field
                      name={`fields.${index}.placeholder`}
                      placeholder="Placeholder (optional)"
                      aria-label="Field placeholder"
                      className={inputClasses}
                    />
                  )}

                  {field.type === 'select' && (
                    <OptionsEditor
                      options={field.options ?? []}
                      onCommit={(options) =>
                        setFieldValue(`fields.${index}.options`, options)
                      }
                    />
                  )}

                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <span className="group inline-grid size-4 grid-cols-1">
                      <Field
                        type="checkbox"
                        name={`fields.${index}.required`}
                        className="col-start-1 row-start-1 appearance-none rounded-sm border border-zinc-950/20 bg-white checked:border-zinc-900 checked:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 forced-colors:appearance-auto"
                      />
                      <svg
                        viewBox="0 0 14 14"
                        fill="none"
                        className="pointer-events-none col-start-1 row-start-1 size-7/8 self-center justify-self-center stroke-white"
                      >
                        <path
                          d="M3 8L6 11L11 3.5"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="group-not-has-checked:opacity-0"
                        />
                      </svg>
                    </span>
                    Required
                  </label>

                  {typeof rowErrors === 'object' && rowErrors?.label && (
                    <p className="text-sm text-red-600">{rowErrors.label}</p>
                  )}
                  {typeof rowErrors === 'object' && rowErrors?.options && (
                    <p className="text-sm text-red-600">{rowErrors.options}</p>
                  )}
                </div>
              );
            })}

            {values.fields.length < MAX_FORM_FIELDS && (
              <button
                type="button"
                onClick={() => push(newField())}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-950/15 py-2 text-sm font-medium text-zinc-600 hover:border-zinc-950/25 hover:bg-white/60 hover:text-zinc-950"
              >
                <Plus className="size-4" />
                Add field
              </button>
            )}
          </div>

          {typeof errors.fields === 'string' && (
            <p className="text-sm text-red-600">{errors.fields}</p>
          )}

          <p className="text-sm text-zinc-500">
            Removing a field doesn&apos;t delete answers already collected for
            it — they stay visible in your responses.
          </p>
        </section>
      )}
    </FieldArray>
  );
};

const OptionsEditor = ({
  options,
  onCommit,
}: {
  options: string[];
  onCommit: (options: string[]) => void;
}) => {
  const [draft, setDraft] = useState('');

  // Blur (committing a draft) and a chip's remove click can fire in the same
  // tick, both closing over the same stale `options` prop — the second commit
  // would silently overwrite the first. Route every read/write through a ref
  // that always holds the latest committed list.
  const latestOptions = useRef(options);
  useEffect(() => {
    latestOptions.current = options;
  }, [options]);

  const commit = (next: string[]) => {
    latestOptions.current = next;
    onCommit(next);
  };

  const addOption = (value: string) => {
    const current = latestOptions.current;
    const trimmed = value.trim();
    setDraft('');
    if (
      !trimmed ||
      current.includes(trimmed) ||
      current.length >= MAX_SELECT_OPTIONS
    ) {
      return;
    }
    commit([...current, trimmed]);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg p-2 ring-1 ring-zinc-950/10 ring-inset focus-within:ring-2 focus-within:ring-zinc-400">
      {options.map((option) => (
        <span
          key={option}
          className="inline-flex items-center gap-1 rounded-md bg-zinc-950/5 py-0.5 pr-1 pl-2 text-sm text-zinc-700"
        >
          {option}
          <button
            type="button"
            aria-label={`Remove option ${option}`}
            onClick={() =>
              commit(
                latestOptions.current.filter(
                  (existing) => existing !== option
                )
              )
            }
            className="grid size-4 place-items-center rounded-sm text-zinc-400 hover:bg-zinc-950/10 hover:text-zinc-700"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        name="new-option"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            // Enter adds an option — never submits the surrounding form.
            event.preventDefault();
            addOption(draft);
          } else if (
            event.key === 'Backspace' &&
            draft === '' &&
            latestOptions.current.length > 0
          ) {
            commit(latestOptions.current.slice(0, -1));
          }
        }}
        onBlur={() => addOption(draft)}
        placeholder={
          options.length === 0 ? 'Type an option and press Enter' : 'Add another…'
        }
        aria-label="Add option"
        className="min-w-32 flex-1 border-0 bg-transparent p-0.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:ring-0 focus:outline-none"
      />
    </div>
  );
};
