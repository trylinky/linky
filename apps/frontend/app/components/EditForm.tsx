import { editForms } from '@/lib/blocks/edit';
import { captureException } from '@sentry/nextjs';
import { Blocks } from '@trylinky/blocks';
import { InternalApi, internalApiFetcher } from '@trylinky/common';
import { toast } from '@trylinky/ui';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

interface Props {
  onClose: () => void;
  blockId: string;
  blockType: Blocks;
}

export function EditForm({ onClose, blockId, blockType }: Props) {
  const { data: blockData, mutate } = useSWR<{
    blockData: any;
    integration: any;
  }>(`/blocks/${blockId}`, internalApiFetcher);

  const router = useRouter();

  const onSave = async (values: any) => {
    try {
      const response = await InternalApi.post(
        `/blocks/${blockId}/update-data`,
        {
          newData: values,
        }
      );

      if (response) {
        mutate(values, {
          optimisticData: values,
        });

        toast({
          title: 'Saved!',
          description: 'Your changes have been saved.',
        });

        // Refresh the page to fetch the new data
        router.refresh();
      }
    } catch (error) {
      captureException(error);
    }
  };

  const CurrentEditForm = editForms[blockType];

  return (
    <div className="max-h-[calc(100vh_-_90px)] overflow-y-auto">
      <CurrentEditForm
        initialValues={blockData?.blockData}
        onSave={onSave}
        onClose={onClose}
        blockId={blockId}
        integration={blockData?.integration}
      />
    </div>
  );
}
