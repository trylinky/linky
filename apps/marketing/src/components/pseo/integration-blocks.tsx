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
  chip: string;
  icon: string;
}

const blockStyleMap: Record<string, BlockStyle> = {
  'spotify-playing-now': {
    Icon: MusicalNoteIcon,
    chip: 'bg-emerald-50',
    icon: 'text-emerald-500',
  },
  'instagram-latest-post': {
    Icon: PhotoIcon,
    chip: 'bg-rose-50',
    icon: 'text-rose-500',
  },
  'instagram-follower-count': {
    Icon: UserGroupIcon,
    chip: 'bg-rose-50',
    icon: 'text-rose-500',
  },
  'tiktok-latest-post': {
    Icon: VideoCameraIcon,
    chip: 'bg-slate-50',
    icon: 'text-slate-500',
  },
  'tiktok-follower-count': {
    Icon: UserGroupIcon,
    chip: 'bg-slate-50',
    icon: 'text-slate-500',
  },
  'threads-follower-count': {
    Icon: UserGroupIcon,
    chip: 'bg-slate-50',
    icon: 'text-slate-500',
  },
  'github-commits-this-month': {
    Icon: CodeBracketIcon,
    chip: 'bg-slate-50',
    icon: 'text-slate-500',
  },
  'link-box': {
    Icon: LinkIcon,
    chip: 'bg-blue-50',
    icon: 'text-blue-500',
  },
  'link-bar': {
    Icon: LinkIcon,
    chip: 'bg-blue-50',
    icon: 'text-blue-500',
  },
  image: {
    Icon: PhotoIcon,
    chip: 'bg-amber-50',
    icon: 'text-amber-500',
  },
  content: {
    Icon: DocumentTextIcon,
    chip: 'bg-violet-50',
    icon: 'text-violet-500',
  },
  youtube: {
    Icon: PlayIcon,
    chip: 'bg-red-50',
    icon: 'text-red-500',
  },
  map: {
    Icon: MapPinIcon,
    chip: 'bg-teal-50',
    icon: 'text-teal-500',
  },
  'waitlist-email': {
    Icon: EnvelopeIcon,
    chip: 'bg-blue-50',
    icon: 'text-blue-500',
  },
  reactions: {
    Icon: HeartIcon,
    chip: 'bg-pink-50',
    icon: 'text-pink-500',
  },
  header: {
    Icon: UserCircleIcon,
    chip: 'bg-gray-50',
    icon: 'text-gray-500',
  },
  stack: {
    Icon: RectangleStackIcon,
    chip: 'bg-gray-50',
    icon: 'text-gray-500',
  },
};

const defaultBlockStyle: BlockStyle = {
  Icon: Squares2X2Icon,
  chip: 'bg-gray-50',
  icon: 'text-gray-500',
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
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 not-prose">
      {entries.map(([key, copy]) => {
        const style = blockStyleMap[key] ?? defaultBlockStyle;
        const { Icon, chip, icon } = style;
        return (
          <li
            key={key}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs hover:shadow-sm transition-shadow"
          >
            <div
              className={`mb-4 inline-flex size-11 items-center justify-center rounded-xl ${chip}`}
            >
              <Icon className={`size-6 ${icon}`} />
            </div>
            <div className="text-base font-semibold text-gray-900">
              {copy.name}
            </div>
            {copy.description && (
              <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                {copy.description}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
