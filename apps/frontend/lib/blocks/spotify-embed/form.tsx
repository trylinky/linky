import { EditFormProps } from '../types';
import { FormField } from '@/components/FormField';
import { SpotifyEmbedBlockConfig, SpotifyEmbedSchema } from '@trylinky/blocks';
import { Button } from '@trylinky/ui';
import { Form, Formik, FormikHelpers } from 'formik';
import { Loader2 } from 'lucide-react';

export function EditForm({
  initialValues,
  onSave,
  onClose,
}: EditFormProps<SpotifyEmbedBlockConfig>) {
  const onSubmit = async (
    values: SpotifyEmbedBlockConfig,
    { setSubmitting }: FormikHelpers<SpotifyEmbedBlockConfig>
  ) => {
    setSubmitting(true);
    onSave(values);
  };

  return (
    <Formik
      initialValues={{
        spotifyAssetUrl: initialValues?.spotifyAssetUrl,
      }}
      validationSchema={SpotifyEmbedSchema}
      onSubmit={onSubmit}
      enableReinitialize={true}
    >
      {({ isSubmitting }) => (
        <Form className="w-full flex flex-col gap-2">
          <FormField
            label="Spotify Playlist or Song URL"
            name="spotifyAssetUrl"
            id="spotifyAssetUrl"
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
