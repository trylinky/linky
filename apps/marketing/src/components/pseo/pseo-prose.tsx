import type { ContentSection } from '@/content/pseo-types';
import { PseoBand } from './pseo-section';

export function PseoProse({ sections }: { sections: ContentSection[] }) {
  return (
    <PseoBand tone="white" className="py-20 md:py-28">
      <div className="mx-auto max-w-2xl">
        {sections.map((section, i) => (
          <div
            key={i}
            className={i === 0 ? '' : 'border-t border-zinc-950/5 pt-14 mt-14'}
          >
            <div className="text-sm font-semibold text-[#E8553F] mb-3">
              {String(i + 1).padStart(2, '0')}
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900">
              {section.heading}
            </h2>
            <p className="mt-5 text-lg leading-8 text-zinc-600">
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </PseoBand>
  );
}
