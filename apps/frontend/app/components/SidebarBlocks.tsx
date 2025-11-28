import { DraggableBlockButton } from '@/app/components/DraggableBlockButton';
import { Blocks } from '@trylinky/blocks';
import { internalApiFetcher } from '@trylinky/common';
import {
  SidebarContentHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
  SidebarMenu,
} from '@trylinky/ui';
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
    <>
      <SidebarContentHeader title="Blocks">
        <div className="relative">
          <SidebarInput
            placeholder="Filter blocks"
            value={search}
            onChange={(ev: any) => setSearch(ev.target.value)}
            className="mt-2 pl-7"
          />
          <SearchIcon className="absolute left-2 top-2 text-muted-foreground/50 size-4" />
        </div>
      </SidebarContentHeader>

      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <div className="overflow-y-auto overscroll-none">
              <div className="space-y-2 flex flex-col" id="tour-blocks">
                {filteredBlocks?.map((block) => {
                  return <DraggableBlockButton key={block} type={block} />;
                })}
              </div>
            </div>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
