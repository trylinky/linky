import type { ContentSection } from '@/content/pseo-types';

export function PseoProse({ sections }: { sections: ContentSection[] }) {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4">
        {sections.map((section, i) => (
          <div
            key={i}
            className="grid gap-8 md:grid-cols-[minmax(0,16rem)_1fr] md:gap-16 py-12 border-t border-zinc-950/5 first:border-t-0"
          >
            <div>
              <p className="text-sm font-semibold text-[#E8553F]">
                {String(i + 1).padStart(2, '0')}
              </p>
              <h2 className="mt-3 text-xl md:text-2xl font-semibold tracking-tight text-zinc-900 text-balance">
                {section.heading}
              </h2>
            </div>
            <p className="text-lg leading-8 text-zinc-600 text-pretty max-w-[62ch]">
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
