import { MarketingContainer } from '@/components/marketing-container';
import { ThemeMock } from '@/components/pseo/theme-mock';
import { templates } from '@/content/templates';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import Link from 'next/link';

export const metadata = buildPseoMetadata({
  title: 'Link in bio templates | Linky',
  description: 'Browse free link-in-bio templates — light, dark, colorful — and apply one to your Linky page in seconds.',
  path: '/i/templates',
});

export default function TemplatesHub() {
  return (
    <div className="bg-[#FCFBF8]">
      <MarketingContainer className="py-16">
        <h1 className="text-4xl font-bold tracking-tight">Templates</h1>
        <p className="mt-4 max-w-2xl text-xl text-gray-600">Free link-in-bio templates you can make your own.</p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <li key={t.slug}>
              <Link href={`/i/templates/${t.slug}`} className="block">
                <ThemeMock palette={t.palette} name={t.name} size="thumb" />
                <div className="mt-3 font-semibold">{t.name}</div>
              </Link>
            </li>
          ))}
        </ul>
      </MarketingContainer>
    </div>
  );
}
