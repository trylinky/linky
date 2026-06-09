import {
  MinimalHubHero,
  MinimalHubSection,
} from '@/components/pseo/minimal-hub';
import { TemplateGallery } from '@/components/pseo/pseo-template-gallery';
import { hslToCss } from '@/components/pseo/theme-mock';
import { templates } from '@/content/templates';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import Link from 'next/link';

export const metadata = buildPseoMetadata({
  title: 'Link in bio templates | Linky',
  description:
    'Browse free link-in-bio templates - light, dark, colourful - and apply one to your Linky page in seconds.',
  path: '/i/templates',
});

export default function TemplatesHub() {
  return (
    <div className="min-h-screen">
      <MinimalHubHero
        eyebrow="Templates"
        h1="Templates"
        answer="Free link-in-bio templates you can make your own. Pick a palette, customise the colours, and publish in minutes - no design skills needed."
      >
        {/* Palette strip - one swatch per template */}
        <div className="mt-10 flex items-center gap-3">
          {templates.map((t) => (
            <Link
              key={t.slug}
              href={`/i/templates/${t.slug}`}
              aria-label={`${t.name} template`}
              title={t.name}
              className="size-9 rounded-full ring-1 ring-zinc-950/10 transition-transform hover:scale-110 md:size-10"
              style={{ backgroundColor: hslToCss(t.palette.colorBgBase) }}
            />
          ))}
        </div>
      </MinimalHubHero>
      <MinimalHubSection>
        <TemplateGallery templates={templates} />
      </MinimalHubSection>
    </div>
  );
}
