import {
  BoltIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import { PseoBand, PseoEyebrow, PseoSectionHeading } from './pseo-section';

export interface BenefitItem {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** @deprecated — unified coral accent is applied automatically; kept for backward-compat */
  iconClassName?: string;
  title: string;
  body: string;
}

export const DEFAULT_LINKY_BENEFITS: BenefitItem[] = [
  {
    Icon: GlobeAltIcon,
    title: 'Custom domains',
    body: 'Connect your own domain on a paid plan to make your page feel truly yours.',
  },
  {
    Icon: PaintBrushIcon,
    title: 'Beautiful themes',
    body: 'Make it yours with custom colours, fonts, and a palette that matches your brand.',
  },
  {
    Icon: RectangleStackIcon,
    title: 'Rich blocks',
    body: 'Music, video, social feeds, and more — not just links. Your page stays fresh automatically.',
  },
  {
    Icon: ChartBarIcon,
    title: 'Analytics',
    body: 'See views and clicks on your blocks and links with built-in analytics on Premium.',
  },
  {
    Icon: BoltIcon,
    title: 'Fast & simple',
    body: 'Build your page in minutes with a drag-and-drop editor. No coding required.',
  },
  {
    Icon: CheckBadgeIcon,
    title: 'Verified pages',
    body: 'Get a verified badge on your page to show your audience that it is the real you.',
  },
];

export function PseoBenefits({
  eyebrow = 'Why Linky',
  heading = 'Why creators choose Linky',
  items = DEFAULT_LINKY_BENEFITS,
}: {
  eyebrow?: string;
  heading?: string;
  items?: BenefitItem[];
}) {
  return (
    <PseoBand tone="white">
      <div className="mb-12">
        <PseoEyebrow>{eyebrow}</PseoEyebrow>
        <div className="mt-3">
          <PseoSectionHeading>{heading}</PseoSectionHeading>
        </div>
      </div>
      <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {items.map((item) => (
          <div key={item.title}>
            <div className="size-11 rounded-xl bg-[#FBEAE6] inline-flex items-center justify-center">
              <item.Icon className="size-6 text-[#E8553F]" />
            </div>
            <dt className="mt-5 text-base font-semibold text-zinc-900">
              {item.title}
            </dt>
            <dd className="mt-2 text-zinc-600 leading-7">{item.body}</dd>
          </div>
        ))}
      </dl>
    </PseoBand>
  );
}
