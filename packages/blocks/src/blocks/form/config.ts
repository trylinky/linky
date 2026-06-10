import * as Yup from 'yup';

export const formFieldTypes = [
  'text',
  'email',
  'textarea',
  'select',
  'checkbox',
] as const;

export type FormFieldType = (typeof formFieldTypes)[number];

export interface FormBlockField {
  // Stable across edits — submitted answers are keyed by this id, so
  // relabeling a field never orphans previously collected answers.
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  // select only
  options?: string[];
}

export interface FormBlockConfig {
  title?: string;
  submitLabel: string;
  successMessage: string;
  fields: FormBlockField[];
}

export const MAX_FORM_FIELDS = 10;

export const formBlockDefaults: FormBlockConfig = {
  title: 'Contact me',
  submitLabel: 'Submit',
  successMessage: 'Thanks — your response was sent.',
  fields: [
    { id: 'field-name', type: 'text', label: 'Name', required: false },
    { id: 'field-email', type: 'email', label: 'Email', required: true },
    { id: 'field-message', type: 'textarea', label: 'Message', required: true },
  ],
};

export const FormBlockSchema = Yup.object().shape({
  title: Yup.string().max(100, 'Titles can be at most 100 characters').notRequired(),
  submitLabel: Yup.string()
    .max(40, 'Button labels can be at most 40 characters')
    .required('A submit button label is required'),
  successMessage: Yup.string()
    .max(300, 'Success messages can be at most 300 characters')
    .required('A success message is required'),
  fields: Yup.array()
    .of(
      Yup.object().shape({
        id: Yup.string().max(64, 'Field ids can be at most 64 characters').required(),
        type: Yup.string()
          .oneOf([...formFieldTypes])
          .required(),
        label: Yup.string()
          .max(100, 'Field labels can be at most 100 characters')
          .required('Every field needs a label'),
        required: Yup.boolean().required(),
        placeholder: Yup.string()
          .max(100, 'Placeholders can be at most 100 characters')
          .notRequired(),
        options: Yup.array()
          .of(Yup.string().max(100).required())
          .when('type', {
            is: 'select',
            then: (schema) =>
              schema
                .min(2, 'Select fields need at least 2 options')
                .max(20, 'Select fields can have at most 20 options')
                .required('Select fields need options'),
            otherwise: (schema) => schema.notRequired(),
          }),
      })
    )
    .min(1, 'Forms need at least one field')
    .max(MAX_FORM_FIELDS, `Forms can have at most ${MAX_FORM_FIELDS} fields`)
    .test('unique-ids', 'Field ids must be unique', (fields) => {
      if (!fields) return true;
      const ids = fields.map((field) => field.id);
      return new Set(ids).size === ids.length;
    })
    .required(),
});
