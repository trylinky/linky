import dragIcon from '@/app/assets/ui/drag.svg';
import blockContentIcon from '@/app/assets/ui/type-content.svg';
import blockGithubCommitsThisMonthIcon from '@/app/assets/ui/type-github-commits-this-month.svg';
import blockHeaderIcon from '@/app/assets/ui/type-header.svg';
import blockImageIcon from '@/app/assets/ui/type-image.svg';
import blockInstagramLatestPostIcon from '@/app/assets/ui/type-instagram-latest-post.svg';
import blockLinkBarIcon from '@/app/assets/ui/type-link-bar.svg';
import blockLinkBoxIcon from '@/app/assets/ui/type-link-box.svg';
import blockMapIcon from '@/app/assets/ui/type-map.svg';
import blockReactionsIcon from '@/app/assets/ui/type-reactions.svg';
import blockSpotifyPlayingNowIcon from '@/app/assets/ui/type-spotify-playing-now.svg';
import blockStackIcon from '@/app/assets/ui/type-stack.svg';
import blockThreadsFollowerCountIcon from '@/app/assets/ui/type-threads-follower-count.svg';
import blockTiktokIcon from '@/app/assets/ui/type-tiktok.svg';
import blockWaitlistEmailIcon from '@/app/assets/ui/type-waitlist-email.svg';
import blockYoutubeIcon from '@/app/assets/ui/type-youtube.svg';
import { useEditModeContext } from '@/app/contexts/Edit';
import { Blocks } from '@trylinky/blocks';
import { useSidebar } from '@trylinky/ui';
import Image from 'next/image';

export const config: Record<
  Blocks,
  {
    title: string;
    label: string;
    icon: string;
    drag: {
      h: number;
      w: number;
    };
  }
> = {
  header: {
    title: 'Header',
    label: 'A primary title and optional subtitle',
    icon: blockHeaderIcon,
    drag: {
      w: 12,
      h: 6,
    },
  },
  content: {
    title: 'Content',
    label: 'A block of text',
    icon: blockContentIcon,
    drag: {
      w: 12,
      h: 6,
    },
  },
  image: {
    title: 'Image',
    label: 'Nothing more, nothing less',
    icon: blockImageIcon,
    drag: {
      w: 8,
      h: 8,
    },
  },
  stack: {
    title: 'Stack',
    label: 'A list of items',
    icon: blockStackIcon,
    drag: {
      w: 6,
      h: 8,
    },
  },
  'github-commits-this-month': {
    title: 'Github Commits (month)',
    label: 'The number of commits this month for a user',
    icon: blockGithubCommitsThisMonthIcon,
    drag: {
      w: 6,
      h: 6,
    },
  },
  'spotify-playing-now': {
    title: 'Spotify Playing Now',
    label: 'The song you are currently playing on Spotify',
    icon: blockSpotifyPlayingNowIcon,
    drag: {
      w: 12,
      h: 4,
    },
  },
  'spotify-embed': {
    title: 'Spotify Embed',
    label: 'Embed a Spotify playlist or song',
    icon: blockSpotifyPlayingNowIcon,
    drag: {
      w: 12,
      h: 4,
    },
  },
  'instagram-latest-post': {
    title: 'Latest Instagram post',
    label: 'The latest post from your connected Instagram account',
    icon: blockInstagramLatestPostIcon,
    drag: {
      w: 12,
      h: 4,
    },
  },
  'instagram-follower-count': {
    title: 'Instagram Follower Count',
    label: 'The number of followers on your Instagram account',
    icon: blockInstagramLatestPostIcon,
    drag: {
      w: 6,
      h: 6,
    },
  },
  map: {
    title: 'Map',
    label: 'A map with a pin',
    icon: blockMapIcon,
    drag: {
      w: 12,
      h: 6,
    },
  },
  'link-box': {
    title: 'Link Box',
    label: 'Display a nicely formatted link',
    icon: blockLinkBoxIcon,
    drag: {
      w: 12,
      h: 2,
    },
  },
  'link-bar': {
    title: 'Link Bar',
    label: 'A row of links to social media',
    icon: blockLinkBarIcon,
    drag: {
      w: 12,
      h: 2,
    },
  },
  'waitlist-email': {
    title: 'GetWaitlist Email',
    label: 'A form to collect emails for your getwaitlist.com project',
    icon: blockWaitlistEmailIcon,
    drag: {
      w: 12,
      h: 5,
    },
  },
  youtube: {
    title: 'YouTube',
    label: 'Embed a YouTube video',
    icon: blockYoutubeIcon,
    drag: {
      w: 12,
      h: 6,
    },
  },
  'threads-follower-count': {
    title: 'Threads Follower Count',
    label: 'The number of followers on your Threads account',
    icon: blockThreadsFollowerCountIcon,
    drag: {
      w: 6,
      h: 6,
    },
  },
  'tiktok-follower-count': {
    title: 'TikTok Follower Count',
    label: 'The number of followers on your TikTok account',
    icon: blockTiktokIcon,
    drag: {
      w: 6,
      h: 6,
    },
  },
  'tiktok-latest-post': {
    title: 'TikTok Latest Post',
    label: 'The latest post from your connected TikTok account',
    icon: blockTiktokIcon,
    drag: {
      w: 6,
      h: 6,
    },
  },
  reactions: {
    title: 'Reactions',
    label: 'A button to react to your page',
    icon: blockReactionsIcon,
    drag: {
      w: 4,
      h: 4,
    },
  },
};

interface Props {
  type: Blocks;
}

export function DraggableBlockButton({ type }: Props) {
  const { setDraggingItem, setNextToAddBlock } = useEditModeContext();

  const { isMobile, setOpen, setSidebarView } = useSidebar();

  const blockConfig = config[type];

  const content = (
    <>
      <Image
        src={dragIcon}
        className="mr-3 hidden md:block"
        width={9}
        height={15}
        alt=""
      />
      <div className="w-9 h-9 bg-stone-100 rounded-md flex items-center mr-3 flex-shrink-0">
        <Image src={blockConfig.icon} className="w-9 h-9" alt="" />
      </div>
      <div className="flex flex-col">
        <span className="font-semibold text-stone-900 text-sm">
          {blockConfig.title}
        </span>
        <span className="text-xs text-slate-600">{blockConfig.label}</span>
      </div>
    </>
  );

  return (
    <>
      <button
        id="hello"
        type="button"
        className="hidden md:flex w-full bg-white border border-stone-200 rounded-md items-center justify-start text-left px-3 py-3 shadow-none hover:shadow-md hover:-translate-y-[2px] transition-shadow transition-transform cursor-move"
        draggable={true}
        unselectable="on"
        onDragStart={(e) => {
          // This is needed to make the drag work in Firefox
          e.dataTransfer.setData('text/plain', '');

          setDraggingItem({
            i: 'tmp-block',
            w: blockConfig.drag.w,
            h: blockConfig.drag.h,
            type,
          });
        }}
      >
        {content}
      </button>
      <button
        type="button"
        className="flex md:hidden w-full bg-white border border-stone-200 rounded-md items-center justify-start text-left px-3 py-3 shadow-none hover:shadow-md transition-shadow"
        onClick={() => {
          setNextToAddBlock({
            i: 'tmp-block',
            w: blockConfig.drag.w,
            h: blockConfig.drag.h,
            type,
          });

          if (isMobile && setOpen) {
            setOpen(false);
          }
        }}
      >
        {content}
      </button>
    </>
  );
}
