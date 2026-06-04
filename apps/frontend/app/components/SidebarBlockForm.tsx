import { config } from '@/app/components/DraggableBlockButton';
import { EditForm } from '@/app/components/EditForm';
import { useEditModeContext } from '@/app/contexts/Edit';
import * as Catalyst from '@trylinky/ui/catalyst';

export function SidebarBlockForm({ onClose }: { onClose: () => void }) {
  const { currentEditingBlock } = useEditModeContext();

  if (!currentEditingBlock) return null;

  return (
    <div className="flex flex-col gap-4">
      <Catalyst.Heading level={2}>
        {`Editing ${config[currentEditingBlock.type].title}`}
      </Catalyst.Heading>
      <EditForm
        onClose={onClose}
        blockId={currentEditingBlock?.id}
        blockType={currentEditingBlock?.type}
      />
    </div>
  );
}
