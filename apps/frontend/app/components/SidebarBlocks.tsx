import { DraggableBlockButton } from '@/app/components/DraggableBlockButton';
import { Blocks } from '@trylinky/blocks';
import { internalApiFetcher } from '@trylinky/common';
import * as Catalyst from '@trylinky/ui/catalyst';
import { SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

export function SidebarBlocks() {
  const [search, setSearch] = useState('');

  const { data: enabledBlocks } = useSWR<Blocks[]>(
    `/blocks/enabled-blocks`,
    internalApiFetcher
  );

  const [filteredBlocks, setFilteredBlocks] = useState(enabledBlocks);

  useEffect(() => {
    if (search === '') {
      setFilteredBlocks(enabledBlocks);
    }

    if (enabledBlocks) {
      setFilteredBlocks(
        enabledBlocks.filter((block) => block.includes(search.toLowerCase()))
      );
    }
  }, [search, enabledBlocks]);

  return (
    <div className="flex flex-col gap-4">
      <Catalyst.InputGroup>
        <SearchIcon data-slot="icon" />
        <Catalyst.Input
          aria-label="Filter blocks"
          placeholder="Filter blocks"
          value={search}
          onChange={(ev) => setSearch(ev.target.value)}
        />
      </Catalyst.InputGroup>

      <div className="overflow-y-auto overscroll-none">
        <div className="space-y-2 flex flex-col" id="tour-blocks">
          {filteredBlocks?.map((block) => {
            return <DraggableBlockButton key={block} type={block} />;
          })}
        </div>
      </div>
    </div>
  );
}
