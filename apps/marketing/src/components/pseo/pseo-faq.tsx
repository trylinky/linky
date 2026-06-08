import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@trylinky/ui';
import { buildFaqSchema, serializeJsonLd } from '@trylinky/seo';

export interface FaqEntry {
  question: string;
  answer: string;
}

export function PseoFaq({ faqs }: { faqs: FaqEntry[] }) {
  return (
    <section className="mx-auto w-full max-w-3xl py-12">
      <h2 className="text-2xl font-bold mb-6">Frequently asked questions</h2>
      <Accordion type="single" collapsible>
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildFaqSchema(faqs)) }}
      />
    </section>
  );
}
