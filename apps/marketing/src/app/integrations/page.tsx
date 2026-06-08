import { MarketingContainer } from '@/components/marketing-container';
import { integrations } from '@/content/integrations';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import Link from 'next/link';

export const metadata = buildPseoMetadata({
  title: 'Link in bio integrations | Linky',
  description: 'Connect Spotify, Instagram, TikTok, Threads, and GitHub to your Linky link-in-bio page. See every integration and what it adds.',
  path: '/i/integrations',
});

export default function IntegrationsHub() {
  return (
    <div className="bg-[#FCFBF8]">
      <MarketingContainer className="py-16">
        <h1 className="text-4xl font-bold tracking-tight">Integrations</h1>
        <p className="mt-4 max-w-2xl text-xl text-gray-600">Everything you can connect to your Linky page.</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((i) => (
            <li key={i.slug}>
              <Link href={`/i/integrations/${i.slug}`} className="block rounded-xl border border-gray-200 bg-white p-6 hover:border-gray-300">
                <div className="text-lg font-semibold">{i.name}</div>
                <p className="mt-1 text-sm text-gray-600">{i.answer}</p>
              </Link>
            </li>
          ))}
        </ul>
      </MarketingContainer>
    </div>
  );
}
