import { LinkyMark } from '@/components/linky-mark';
import {
  MinimalHubHero,
  MinimalHubSection,
} from '@/components/pseo/minimal-hub';
import { alternatives } from '@/content/alternatives';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import Link from 'next/link';

export const metadata = buildPseoMetadata({
  title: 'Link in bio alternatives | Linky',
  description:
    'See how Linky compares to Linktree, Beacons, Bio.link, Carrd, and Later - and why creators switch to a richer link-in-bio page.',
  path: '/i/alternatives',
});

export default function AlternativesHub() {
  return (
    <div className="min-h-screen">
      <MinimalHubHero
        eyebrow="Compare"
        h1="Linky vs the alternatives"
        answer="Honest, side-by-side comparisons with every major link-in-bio tool. See where Linky wins, where others have strengths, and which platform fits how you work."
      />
      <MinimalHubSection>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {alternatives.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/i/alternatives/${a.slug}`}
                className="group flex h-full flex-col rounded-2xl bg-white p-6 ring-1 ring-zinc-950/5 transition hover:shadow-sm hover:ring-zinc-950/10"
              >
                {/* Duel motif */}
                <div className="flex items-center">
                  <span className="z-10 inline-flex size-10 items-center justify-center rounded-full bg-zinc-900 text-white ring-2 ring-white">
                    <LinkyMark className="size-4" />
                  </span>
                  <span className="-ml-2 inline-flex size-10 items-center justify-center rounded-full bg-[#FAFAF9] text-sm font-semibold text-zinc-500 ring-1 ring-zinc-950/10">
                    {a.competitor.charAt(0)}
                  </span>
                </div>
                <div className="mt-4 text-lg font-semibold text-zinc-900">
                  Linky vs {a.competitor}
                </div>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-zinc-500 line-clamp-3">
                  {a.answer}
                </p>
                <span className="mt-4 text-sm font-medium text-zinc-900">
                  Read the comparison{' '}
                  <span className="inline-block transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </MinimalHubSection>
    </div>
  );
}
