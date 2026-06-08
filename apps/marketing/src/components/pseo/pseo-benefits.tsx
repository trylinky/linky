import {
  BoltIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import { PseoBand, PseoSectionHeading } from './pseo-section';

export interface BenefitItem {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconClassName: string;
  title: string;
  body: string;
}

export const DEFAULT_LINKY_BENEFITS: BenefitItem[] = [
  {
    Icon: GlobeAltIcon,
    iconClassName: 'text-blue-500',
    title: 'Custom domains',
    body: 'Connect your own domain on a paid plan to make your page feel truly yours.',
  },
  {
    Icon: PaintBrushIcon,
    iconClassName: 'text-purple-500',
    title: 'Beautiful themes',
    body: 'Make it yours with custom colours, fonts, and a palette that matches your brand.',
  },
  {
    Icon: RectangleStackIcon,
    iconClassName: 'text-green-500',
    title: 'Rich blocks',
    body: 'Music, video, social feeds, and more — not just links. Your page stays fresh automatically.',
  },
  {
    Icon: ChartBarIcon,
    iconClassName: 'text-yellow-500',
    title: 'Analytics',
    body: 'See views and clicks on your blocks and links with built-in analytics on Premium.',
  },
  {
    Icon: BoltIcon,
    iconClassName: 'text-orange-500',
    title: 'Fast & simple',
    body: 'Build your page in minutes with a drag-and-drop editor. No coding required.',
  },
  {
    Icon: CheckBadgeIcon,
    iconClassName: 'text-red-500',
    title: 'Verified pages',
    body: 'Get a verified badge on your page to show your audience that it is the real you.',
  },
];

export function PseoBenefits({
  heading = 'Why creators choose Linky',
  items = DEFAULT_LINKY_BENEFITS,
}: {
  heading?: string;
  items?: BenefitItem[];
}) {
  return (
    <PseoBand tone="white">
      <div className="text-center mb-12">
        <PseoSectionHeading>{heading}</PseoSectionHeading>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {items.map((item) => (
          <div key={item.title} className="flex flex-col text-left">
            <item.Icon className={`size-10 mb-3 ${item.iconClassName}`} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {item.title}
            </h3>
            <p className="text-gray-600 leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>
    </PseoBand>
  );
}
