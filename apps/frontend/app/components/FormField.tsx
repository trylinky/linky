import { FormInput, FormInputWithPrefix } from '@/components/FormInput';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';
import { Label } from '@trylinky/ui';
import { ReactNode } from 'react';

interface Props {
  name: string;
  id: string;
  label: string;
  labelDetail?: ReactNode;
  placeholder?: string;
  fieldType?: 'input' | 'textarea' | 'select';
  type?: 'text' | 'email' | 'number' | 'checkbox';
  error?: string | undefined;
  isTextArea?: boolean;
  children?: ReactNode;
  withPrefix?: string;
  className?: string;
  disabled?: boolean;
}

export function FormField({
  fieldType = 'input',
  children,
  name,
  label,
  labelDetail,
  id,
  placeholder,
  error,
  type = 'text',
  withPrefix,
  disabled,
  className,
}: Props) {
  const InputComponent = withPrefix ? FormInputWithPrefix : FormInput;
  return (
    <div className={className}>
      <Label htmlFor={name}>
        <div className="flex items-center justify-between">
          {label}
          {labelDetail}
        </div>
      </Label>
      <div className="relative mt-1 rounded-md">
        <InputComponent
          fieldType={fieldType}
          type={type}
          name={name}
          id={id}
          placeholder={placeholder}
          ariaInvalid={error ? 'true' : 'false'}
          ariaDescribedby={`${name}-error`}
          prefix={withPrefix}
          disabled={disabled}
        >
          {children}
        </InputComponent>
        {error && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ExclamationCircleIcon
              className="h-5 w-5 text-red-500"
              aria-hidden="true"
            />
          </div>
        )}
      </div>
      <p className="mt-2 text-sm text-red-600" id={`${name}-error`}>
        {error}
      </p>
    </div>
  );
}
