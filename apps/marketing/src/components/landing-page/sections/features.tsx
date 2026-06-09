import analyticsImg from '@/assets/landing-page/analytics.png';
import realtimeBlocksImg from '@/assets/landing-page/realtime-blocks.png';
import { MarketingContainer } from '@/components/marketing-container';
import {
  CheckBadgeIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  LockClosedIcon,
  PaintBrushIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@trylinky/ui';
import type { ComponentType, SVGProps } from 'react';
import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';

function FramedShot({ src, alt }: { src: StaticImageData; alt: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-950/5">
      <div className="overflow-hidden rounded-xl bg-[#FAFAF9]">
        <Image
          src={src}
          alt={alt}
          width={852}
          height={590}
          className="h-auto w-full outline-1 -outline-offset-1 outline-black/5"
        />
      </div>
    </div>
  );
}

function FeatureSplit({
  eyebrow,
  heading,
  body,
  linkHref,
  linkLabel,
  imageSrc,
  imageAlt,
  reverse = false,
  tone = 'white',
}: {
  eyebrow: string;
  heading: string;
  body: string;
  linkHref: string;
  linkLabel: string;
  imageSrc: StaticImageData;
  imageAlt: string;
  reverse?: boolean;
  tone?: 'white' | 'grey';
}) {
  const text = (
    <div className="flex flex-col justify-center">
      <p className="flex items-center gap-2 text-sm font-medium text-zinc-500">
        <span className="inline-block h-px w-6 bg-zinc-300" />
        {eyebrow}
      </p>
      <h2 className="mt-3 max-w-[40ch] text-3xl font-semibold tracking-tight text-zinc-900 text-balance md:text-4xl">
        {heading}
      </h2>
      <p className="mt-4 max-w-[52ch] text-lg leading-8 text-zinc-500 text-pretty">
        {body}
      </p>
      <Link
        href={linkHref}
        className="mt-6 text-sm font-medium text-zinc-900 transition-colors hover:text-zinc-600"
      >
        {linkLabel} →
      </Link>
    </div>
  );

  const image = <FramedShot src={imageSrc} alt={imageAlt} />;

  return (
    <section
      className={cn(
        'border-t border-zinc-950/5 py-20 md:py-28',
        tone === 'grey' ? 'bg-[#FAFAF9]' : 'bg-white'
      )}
    >
      <MarketingContainer>
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
          {reverse ? (
            <>
              <div className="order-last md:order-first">{image}</div>
              {text}
            </>
          ) : (
            <>
              {text}
              {image}
            </>
          )}
        </div>
      </MarketingContainer>
    </section>
  );
}

export const FeatureSplits = () => {
  return (
    <>
      <FeatureSplit
        eyebrow="Live blocks"
        heading="A page that updates itself"
        body="Connect Spotify, Instagram, TikTok, and GitHub once, and your page stays current on its own. Visitors always see your latest track, post, and activity, not whatever you last remembered to paste in."
        linkHref="/i/integrations"
        linkLabel="Explore integrations"
        imageSrc={realtimeBlocksImg}
        imageAlt="Live content blocks showing real-time data"
        tone="grey"
      />
      <FeatureSplit
        eyebrow="Analytics"
        heading="Know exactly what's working"
        body="See views and clicks for every link and block, so you can lead with what your audience actually wants. Move the winners up, cut the rest, and watch the difference."
        linkHref="/i/pricing"
        linkLabel="Included with Premium"
        imageSrc={analyticsImg}
        imageAlt="Linky analytics dashboard"
        reverse
      />
    </>
  );
};

const MORE_FEATURES: {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
}[] = [
  {
    Icon: GlobeAltIcon,
    title: 'Custom domains',
    description: 'Use your own domain name to make your page more professional.',
  },
  {
    Icon: LockClosedIcon,
    title: 'Private pages',
    description: 'Build pages that are only accessible to you and your team.',
  },
  {
    Icon: DocumentTextIcon,
    title: 'Forms',
    description: 'Collect emails, phone numbers, and more with a built-in form builder.',
  },
  {
    Icon: PaintBrushIcon,
    title: 'Custom themes',
    description: 'Match your page to your brand with the custom theme builder.',
  },
  {
    Icon: CheckBadgeIcon,
    title: 'Verified pages',
    description: 'Get a badge to show your audience that your page is the real you.',
  },
  {
    Icon: UserGroupIcon,
    title: 'Agency support',
    description: 'Manage multiple pages and users with our agency features.',
  },
];

export const ExpandedFeaturesSection = () => {
  return (
    <section className="border-t border-zinc-950/5 bg-white py-20 md:py-28">
      <MarketingContainer>
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-zinc-500">
            <span className="inline-block h-px w-6 bg-zinc-300" />
            More
          </p>
          <h2 className="mt-3 max-w-[40ch] text-3xl font-semibold tracking-tight text-zinc-900 text-balance md:text-4xl">
            And much more
          </h2>
        </div>
        <dl className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-x-12 md:gap-y-12">
          {MORE_FEATURES.map((f) => (
            <div key={f.title} className="text-left">
              <div className="inline-flex size-11 items-center justify-center rounded-xl bg-[#FAFAF9] ring-1 ring-zinc-950/5">
                <f.Icon className="size-6 text-zinc-900" strokeWidth={1.5} />
              </div>
              <dt className="mt-5 text-base font-semibold text-zinc-900">
                {f.title}
              </dt>
              <dd className="mt-2 leading-7 text-zinc-500">{f.description}</dd>
            </div>
          ))}
        </dl>
      </MarketingContainer>
    </section>
  );
};
