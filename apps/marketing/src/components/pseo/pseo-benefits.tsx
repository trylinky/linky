import {
  BoltIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import { MarketingContainer } from '@/components/marketing-container';
import type { ComponentType, SVGProps } from 'react';

export interface BenefitItem {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** @deprecated - unified coral accent is applied automatically; kept for backward-compat */
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
    body: 'Music, video, social feeds, and more - not just links. Your page stays fresh automatically.',
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
  minimal = false,
}: {
  eyebrow?: string;
  heading?: string;
  items?: BenefitItem[];
  minimal?: boolean;
}) {
  if (minimal) {
    return (
      <section className="border-t border-zinc-950/5 bg-white py-20 md:py-28">
        <MarketingContainer>
          <div className="mb-12">
            <p className="flex items-center gap-2 text-sm font-medium text-zinc-500">
              <span className="inline-block h-px w-6 bg-zinc-300" />
              {eyebrow}
            </p>
            <div className="mt-3">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 text-balance">
                {heading}
              </h2>
            </div>
          </div>
          <dl className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div key={item.title}>
                <div className="inline-flex size-11 items-center justify-center rounded-xl bg-white ring-1 ring-zinc-950/5">
                  <item.Icon className="size-6 text-zinc-900" strokeWidth={1.5} />
                </div>
                <dt className="mt-5 text-base font-semibold text-zinc-900">
                  {item.title}
                </dt>
                <dd className="mt-2 leading-7 text-zinc-500">{item.body}</dd>
              </div>
            ))}
          </dl>
        </MarketingContainer>
      </section>
    );
  }

  return (
    <section className="bg-[#1A1712] py-20 md:py-28">
      <MarketingContainer>
        <div className="mb-12">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#FF7A5C]">
            <span className="inline-block size-1.5 rounded-full bg-[#FF7A5C]" />
            {eyebrow}
          </p>
          <div className="mt-3">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white text-balance">
              {heading}
            </h2>
          </div>
        </div>
        <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {items.map((item) => (
            <div key={item.title}>
              <div className="size-11 rounded-xl bg-white/8 inline-flex items-center justify-center">
                <item.Icon className="size-6 text-[#FF7A5C]" />
              </div>
              <dt className="mt-5 text-base font-semibold text-white">
                {item.title}
              </dt>
              <dd className="mt-2 text-zinc-400 leading-7">{item.body}</dd>
            </div>
          ))}
        </dl>
      </MarketingContainer>
    </section>
  );
}
