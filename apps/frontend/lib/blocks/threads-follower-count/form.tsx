import { EditFormProps } from '../types';
import { BlockIntegrationUI } from '@/app/components/BlockIntegrationUI';
import { InstagramLatestPostBlockConfig } from '@trylinky/blocks';

export function EditForm({
  integration,
  blockId,
}: EditFormProps<InstagramLatestPostBlockConfig>) {
  return (
    <BlockIntegrationUI
      blockId={blockId}
      integration={integration}
      integrationType="threads"
    />
  );
}
