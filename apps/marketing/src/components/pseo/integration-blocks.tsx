import {
  CodeBracketIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  HeartIcon,
  LinkIcon,
  MapPinIcon,
  MusicalNoteIcon,
  PhotoIcon,
  PlayIcon,
  RectangleStackIcon,
  Squares2X2Icon,
  UserCircleIcon,
  UserGroupIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { blocks } from '@trylinky/blocks';
import type { ComponentType, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

interface BlockStyle {
  Icon: ComponentType<IconProps>;
}

const blockStyleMap: Record<string, BlockStyle> = {
  'spotify-playing-now': { Icon: MusicalNoteIcon },
  'instagram-latest-post': { Icon: PhotoIcon },
  'instagram-follower-count': { Icon: UserGroupIcon },
  'tiktok-latest-post': { Icon: VideoCameraIcon },
  'tiktok-follower-count': { Icon: UserGroupIcon },
  'threads-follower-count': { Icon: UserGroupIcon },
  'github-commits-this-month': { Icon: CodeBracketIcon },
  'link-box': { Icon: LinkIcon },
  'link-bar': { Icon: LinkIcon },
  image: { Icon: PhotoIcon },
  content: { Icon: DocumentTextIcon },
  youtube: { Icon: PlayIcon },
  map: { Icon: MapPinIcon },
  'waitlist-email': { Icon: EnvelopeIcon },
  reactions: { Icon: HeartIcon },
  header: { Icon: UserCircleIcon },
  stack: { Icon: RectangleStackIcon },
};

const defaultBlockStyle: BlockStyle = {
  Icon: Squares2X2Icon,
};

/** True if `key` is a real block in the @trylinky/blocks registry. */
export function isRealBlock(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(blocks, key);
}

/**
 * Lists the real blocks an integration page showcases. The content module
 * declares the block keys + presentation copy in `blockCopy`; we render only
 * keys that genuinely exist in the @trylinky/blocks registry (real-data guarantee).
 */
export function IntegrationBlocks({
  blockCopy,
}: {
  blockCopy: Record<string, { name: string; description: string }>;
}) {
  const entries = Object.entries(blockCopy).filter(([key]) => isRealBlock(key));
  return (
    <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 not-prose">
      {entries.map(([key, copy]) => {
        const style = blockStyleMap[key] ?? defaultBlockStyle;
        const { Icon } = style;
        return (
          <li
            key={key}
            className="bg-white rounded-2xl ring-1 ring-black/5 p-6 hover:ring-black/10 transition"
          >
            <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-[#FBEAE6]">
              <Icon className="size-6 text-[#E8553F]" />
            </div>
            <div className="text-base font-semibold text-zinc-900">
              {copy.name}
            </div>
            {copy.description && (
              <p className="mt-1.5 text-sm text-zinc-600 leading-relaxed">
                {copy.description}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
