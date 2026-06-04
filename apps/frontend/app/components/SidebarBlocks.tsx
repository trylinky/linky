import { DraggableBlockButton } from '@/app/components/DraggableBlockButton';
import { Blocks } from '@trylinky/blocks';
import { internalApiFetcher } from '@trylinky/common';
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
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
        <input
          aria-label="Filter blocks"
          placeholder="Filter blocks"
          value={search}
          onChange={(ev) => setSearch(ev.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white/60 py-2.5 pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-zinc-400"
        />
      </div>

      <div className="space-y-2 flex flex-col" id="tour-blocks">
        {filteredBlocks?.map((block) => {
          return <DraggableBlockButton key={block} type={block} />;
        })}
      </div>
    </div>
  );
}
