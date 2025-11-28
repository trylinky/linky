import { BlockIntegrationUI } from '@/app/components/BlockIntegrationUI';
import { EditFormProps } from '@/lib/blocks/types';
import { TikTokFollowerCountBlockConfig } from '@trylinky/blocks';

export function EditForm({
  integration,
  blockId,
}: EditFormProps<TikTokFollowerCountBlockConfig>) {
  return (
    <BlockIntegrationUI
      blockId={blockId}
      integration={integration}
      integrationType="tiktok"
    />
  );
}
