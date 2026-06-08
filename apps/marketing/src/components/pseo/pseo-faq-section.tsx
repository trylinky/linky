'use client';

import { buildFaqSchema, serializeJsonLd } from '@trylinky/seo';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@trylinky/ui';
import type { FaqEntry } from './pseo-faq';
import { PseoBand, PseoSectionHeading } from './pseo-section';

export function PseoFaqSection({ faqs }: { faqs: FaqEntry[] }) {
  return (
    <PseoBand tone="cream">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        <div>
          <PseoSectionHeading>Frequently asked questions</PseoSectionHeading>
          <p className="mt-4 text-lg text-gray-600">
            Everything you need to know to get started.
          </p>
        </div>
        <div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-base font-medium text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-black/60">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(buildFaqSchema(faqs)),
        }}
      />
    </PseoBand>
  );
}
