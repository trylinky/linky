import { EditFormProps } from '../types';
import { BlockIntegrationUI } from '@/app/components/BlockIntegrationUI';

export function EditForm({ integration, blockId }: EditFormProps<{}>) {
  return (
    <BlockIntegrationUI
      blockId={blockId}
      integration={integration}
      integrationType="spotify"
    />
  );
}
