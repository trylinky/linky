'use client';

import { FormField } from './FormField';

// We don't need FieldInputProps, FormikErrors, FormikTouched from 'formik' directly in this component
// as FormField handles the Formik integration internally via the name prop.

interface HandleStepProps {
  // pageSlug and setFieldValue are implicitly handled by Formik when FormField is used
  // within a Formik context and connected via the `name` prop.
  // We only need to pass the error and touched status for displaying errors.
  error?: string;
  touched?: boolean;
}

export function HandleStep({ error, touched }: HandleStepProps) {
  return (
    <div>
      <FormField
        withPrefix="lin.ky/"
        label="Handle"
        name="pageSlug" // This connects to Formik state in NewPageDialog.tsx
        placeholder="your-page"
        id="pageSlug"
        // value and onChange are handled by Formik through the <Field> component inside FormField
        error={touched && error ? error : undefined}
      />
      <p className="text-xs text-slate-500 mt-1 px-1">
        Only lowercase letters, numbers, dashes, and underscores.
      </p>
    </div>
  );
}
