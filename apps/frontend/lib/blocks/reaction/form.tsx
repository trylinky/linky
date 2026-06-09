import { EditFormProps } from '../types';
import { reactionMeta } from './ui';
import { FormField } from '@/components/FormField';
import {
  ReactionBlockConfig,
  ReactionSchema,
  defaultReactionType,
  reactionTypes,
} from '@trylinky/blocks';
import { Button, cn } from '@trylinky/ui';
import { Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import { Loader2 } from 'lucide-react';

export function EditForm({
  initialValues,
  onSave,
  onClose,
}: EditFormProps<ReactionBlockConfig>) {
  const handleSubmit = async (
    values: ReactionBlockConfig,
    { setSubmitting }: FormikHelpers<ReactionBlockConfig>
  ) => {
    setSubmitting(true);
    onSave(values);
  };

  return (
    <Formik<ReactionBlockConfig>
      initialValues={{
        reactionType: initialValues?.reactionType ?? defaultReactionType,
        label: initialValues?.label ?? '',
      }}
      validationSchema={ReactionSchema}
      onSubmit={handleSubmit}
      enableReinitialize={true}
    >
      {({ isSubmitting, values, errors }) => (
        <Form className="w-full flex flex-col gap-2">
          <ReactionTypeSelect />

          <FormField
            label="Label"
            name="label"
            id="label"
            placeholder={reactionMeta[values.reactionType].label}
            error={errors.label}
          />

          <div className="flex shrink-0 justify-between py-4 border-t border-stone-200">
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

const ReactionTypeSelect = () => {
  const { values, setFieldValue } = useFormikContext<ReactionBlockConfig>();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-stone-700">Reaction</span>
      <div className="grid grid-cols-5 gap-2">
        {reactionTypes.map((type) => {
          const meta = reactionMeta[type];
          const Icon = meta.icon;
          const isSelected = values.reactionType === type;

          return (
            <button
              key={type}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setFieldValue('reactionType', type)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 transition-colors',
                isSelected
                  ? 'border-stone-800 bg-stone-100'
                  : 'border-stone-200 bg-white hover:bg-stone-50'
              )}
            >
              <Icon
                className={isSelected ? 'fill-stone-800' : 'fill-stone-400'}
                width={24}
                height={24}
              />
              <span className="text-xs text-stone-600">{meta.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
