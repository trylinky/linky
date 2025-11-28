import { Input, cn } from '@trylinky/ui';
import { Field } from 'formik';
import { ReactNode } from 'react';

interface Props {
  name: string;
  id: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'number' | 'checkbox';
  initialValue?: string;
  hasError?: boolean;
  ariaDescribedby?: string;
  ariaInvalid?: 'true' | 'false';
  fieldType?: 'input' | 'textarea' | 'select';
  children?: ReactNode;
  prefix?: string;
  disabled?: boolean;
}

export function FormInput({
  name,
  placeholder,
  initialValue,
  hasError,
  type = 'text',
  ariaInvalid,
  ariaDescribedby,
  fieldType = 'input',
  children,
  disabled,
}: Props) {
  return (
    <Field name={name}>
      {({ field }: any) => (
        <Input
          {...field}
          placeholder={placeholder}
          type={type}
          className={cn(
            type !== 'checkbox' && 'w-full',
            disabled && 'bg-gray-100',
            hasError && 'border-red-500'
          )}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedby}
          disabled={disabled}
        >
          {fieldType === 'select' ? children : undefined}
        </Input>
      )}
    </Field>
  );
}

export function FormInputWithPrefix({
  name,
  placeholder,
  initialValue,
  hasError,
  type = 'text',
  fieldType = 'input',
  ariaInvalid,
  ariaDescribedby,
  children,
  prefix,
}: Props) {
  return (
    <div className="flex">
      <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 px-3 text-gray-500 sm:text-sm">
        {prefix}
      </span>
      <Field name={name}>
        {({ field }: any) => (
          <Input
            {...field}
            placeholder={placeholder}
            type={type}
            className="block w-full min-w-0 flex-1 pl-3 rounded-none rounded-r-md"
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedby}
          >
            {fieldType === 'select' ? children : undefined}
          </Input>
        )}
      </Field>
    </div>
  );
}
