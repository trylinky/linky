import type { ContentSection } from '@/content/pseo-types';
import { PseoBand } from './pseo-section';

export function PseoProse({ sections }: { sections: ContentSection[] }) {
  return (
    <PseoBand tone="white" className="py-20 md:py-28">
      <div className="mx-auto max-w-2xl">
        {sections.map((section, i) => (
          <div
            key={i}
            className={i === 0 ? '' : 'border-t border-gray-100 pt-14 mt-14'}
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              {String(i + 1).padStart(2, '0')}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              {section.heading}
            </h2>
            <p className="mt-5 text-lg leading-8 text-gray-600">
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </PseoBand>
  );
}
