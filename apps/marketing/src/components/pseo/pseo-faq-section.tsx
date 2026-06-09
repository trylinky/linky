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

export function PseoFaqSection({
  faqs,
  minimal = false,
}: {
  faqs: FaqEntry[];
  minimal?: boolean;
}) {
  return (
    <PseoBand
      tone={minimal ? 'white' : 'beige'}
      className={minimal ? 'border-t border-zinc-950/5' : undefined}
    >
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        <div>
          <PseoSectionHeading>Frequently asked questions</PseoSectionHeading>
          <p className="mt-4 text-lg leading-8 text-zinc-600 text-pretty">
            Everything you need to know to get started.
          </p>
        </div>
        <div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border-zinc-950/5"
              >
                <AccordionTrigger className="text-base font-medium text-left text-zinc-900 hover:text-zinc-700">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-zinc-600">
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
