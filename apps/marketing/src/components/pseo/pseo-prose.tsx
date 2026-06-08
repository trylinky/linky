import type { ContentSection } from '@/content/pseo-types';
import { PseoBand } from './pseo-section';

export function PseoProse({ sections }: { sections: ContentSection[] }) {
  return (
    <PseoBand tone="white">
      <div className="mx-auto max-w-3xl">
        {sections.map((section, i) => (
          <div key={i}>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-12 first:mt-0">
              {section.heading}
            </h2>
            <p className="mt-4 text-lg text-gray-700 leading-relaxed">
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </PseoBand>
  );
}
