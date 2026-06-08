import { MarketingContainer } from '@/components/marketing-container';
import { niches } from '@/content/niches';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import Link from 'next/link';

export const metadata = buildPseoMetadata({
  title: 'Link in bio for every creator and business | Linky',
  description:
    'Link-in-bio pages tailored for musicians, photographers, restaurants, developers, and more. Find the right setup for you.',
  path: '/for',
});

export default function NichesHub() {
  return (
    <div className="bg-[#FCFBF8]">
      <MarketingContainer className="py-16">
        <h1 className="text-4xl font-bold tracking-tight">Linky for everyone</h1>
        <p className="mt-4 max-w-2xl text-xl text-gray-600">A link in bio tailored to what you do.</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {niches.map((n) => (
            <li key={n.slug}>
              <Link href={`/for/${n.slug}`} className="block rounded-xl border border-gray-200 bg-white p-6 hover:border-gray-300">
                <div className="text-lg font-semibold">{n.name}</div>
                <p className="mt-1 text-sm text-gray-600">{n.answer}</p>
              </Link>
            </li>
          ))}
        </ul>
      </MarketingContainer>
    </div>
  );
}
