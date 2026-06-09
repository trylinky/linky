import { MarketingContainer } from '@/components/marketing-container';
import { MinimalHeading } from '@/components/minimal-heading';
import { ThemeMock } from '@/components/pseo/theme-mock';
import { templates } from '@/content/templates';
import { cn } from '@trylinky/ui';
import Link from 'next/link';

function MarqueeRow({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="flex gap-6 pr-6" aria-hidden={hidden || undefined}>
      {templates.map((t, i) => (
        <Link
          key={t.slug}
          href={`/i/templates/${t.slug}`}
          tabIndex={hidden ? -1 : undefined}
          className={cn(
            'w-56 shrink-0 transition-transform duration-300 hover:-translate-y-1.5 hover:rotate-0',
            i % 2 ? 'rotate-[1.5deg]' : 'rotate-[-1.5deg]'
          )}
        >
          <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-zinc-950/5">
            <ThemeMock palette={t.palette} name={t.name} size="thumb" />
          </div>
          <p className="mt-3 text-center text-sm font-semibold text-zinc-900">
            {t.name}
          </p>
        </Link>
      ))}
    </div>
  );
}

export function TemplatesStrip() {
  return (
    <section className="overflow-hidden border-t border-zinc-950/5 bg-[#FAFAF9] py-20 md:py-28">
      <MarketingContainer>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <MinimalHeading
            eyebrow="Templates"
            heading="Start from something beautiful"
            body="Pick a palette, tweak the colours, publish. Every template is fully yours to customise."
          />
          <Link
            href="/i/templates"
            className="mb-1 shrink-0 text-sm font-medium text-zinc-900 transition-colors hover:text-zinc-600"
          >
            Browse all templates →
          </Link>
        </div>
      </MarketingContainer>

      {/* Full-bleed marquee of tilted template cards; pauses on hover */}
      <div className="group relative mt-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-[#FAFAF9] to-transparent md:w-28"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-[#FAFAF9] to-transparent md:w-28"
        />
        <div className="flex w-max animate-[templates-marquee_45s_linear_infinite] py-4 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          <MarqueeRow />
          <MarqueeRow hidden />
        </div>
      </div>
    </section>
  );
}
