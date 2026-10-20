import { editForms } from '@/lib/blocks/edit';
import { captureException } from '@sentry/nextjs';
import { Blocks } from '@trylinky/blocks';
import { InternalApi, internalApiFetcher } from '@trylinky/common';
import { toast } from '@trylinky/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import useSWR from 'swr';

interface Props {
  onClose: () => void;
  blockId: string;
  blockType: Blocks;
}

export function EditForm({ onClose, blockId, blockType }: Props) {
  const {
    data: blockData,
    error: loadError,
    mutate,
  } = useSWR<{
    blockData: any;
    integration: any;
  }>(`/blocks/${blockId}`, internalApiFetcher);

  const router = useRouter();

  // internalApiFetcher resolves with the error body for JSON error responses
  // and throws for non-JSON ones (e.g. a plain-text 401); both mean the form
  // has nothing to edit.
  const failedToLoad =
    !!loadError || (!!blockData && 'error' in (blockData as object));

  useEffect(() => {
    if (failedToLoad) {
      captureException(loadError ?? new Error('Failed to load block data'));
      toast({
        title: 'Could not load this block',
        description: 'Please refresh the page and try again.',
        variant: 'error',
      });
    }
  }, [failedToLoad, loadError]);

  const onSave = async (values: any) => {
    try {
      const response = await InternalApi.post(
        `/blocks/${blockId}/update-data`,
        {
          newData: values,
        }
      );

      // InternalApi resolves rather than throws on failure; only a successful
      // update returns the block id.
      if (!response?.id) {
        throw new Error(
          response?.error?.message ?? 'Failed to save block data'
        );
      }

      mutate(values, {
        optimisticData: values,
      });

      toast({
        title: 'Saved!',
        description: 'Your changes have been saved.',
      });

      // Refresh the page to fetch the new data
      router.refresh();
    } catch (error) {
      captureException(error);
      toast({
        title: 'Could not save your changes',
        description: 'Please try again.',
        variant: 'error',
      });
    }
  };

  const CurrentEditForm = editForms[blockType];

  return (
    <CurrentEditForm
      initialValues={blockData?.blockData}
      onSave={onSave}
      onClose={onClose}
      blockId={blockId}
      integration={blockData?.integration}
    />
  );
}
