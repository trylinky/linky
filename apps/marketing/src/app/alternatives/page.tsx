import { MarketingContainer } from '@/components/marketing-container';
import { alternatives } from '@/content/alternatives';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import Link from 'next/link';

export const metadata = buildPseoMetadata({
  title: 'Link in bio alternatives | Linky',
  description:
    'See how Linky compares to Linktree, Beacons, Bio.link, Carrd, and Later — and why creators switch to a richer link-in-bio page.',
  path: '/i/alternatives',
});

export default function AlternativesHub() {
  return (
    <div className="bg-[#FCFBF8]">
      <MarketingContainer className="py-16">
        <h1 className="text-4xl font-bold tracking-tight">Linky vs the alternatives</h1>
        <p className="mt-4 max-w-2xl text-xl text-gray-600">Honest comparisons with the other link-in-bio tools.</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {alternatives.map((a) => (
            <li key={a.slug}>
              <Link href={`/i/alternatives/${a.slug}`} className="block rounded-xl border border-gray-200 bg-white p-6 hover:border-gray-300">
                <div className="text-lg font-semibold">Linky vs {a.competitor}</div>
                <p className="mt-1 text-sm text-gray-600">{a.answer}</p>
              </Link>
            </li>
          ))}
        </ul>
      </MarketingContainer>
    </div>
  );
}
