import Link from 'next/link';
import { ThemeMock, type ThemePalette } from './theme-mock';

export function TemplateGallery({
  templates,
  currentSlug,
}: {
  templates: { slug: string; name: string; palette: ThemePalette }[];
  currentSlug?: string;
}) {
  const visible = templates.filter((t) => t.slug !== currentSlug);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {visible.map((t) => (
        <Link
          key={t.slug}
          href={`/i/templates/${t.slug}`}
          className="group block"
        >
          <ThemeMock palette={t.palette} name={t.name} size="thumb" />
          <p className="mt-3 text-sm font-semibold text-gray-900 group-hover:text-gray-600 transition-colors">
            {t.name}
          </p>
        </Link>
      ))}
    </div>
  );
}
