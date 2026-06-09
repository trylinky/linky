import { MarketingContainer } from '@/components/marketing-container';
import { MinimalHeading } from '@/components/minimal-heading';

const STEPS = [
  {
    title: 'Claim your username',
    body: 'Pick your handle and your page exists at lin.ky/yourname. It takes about thirty seconds.',
  },
  {
    title: 'Add your blocks',
    body: 'Drag in links, music, video, and live integrations. Pick a theme and make it yours. No code.',
  },
  {
    title: 'Share one link',
    body: 'Drop it in every bio. Update the page whenever you like - the link never changes.',
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-zinc-950/5 bg-[#FAFAF9] py-20 md:py-28">
      <MarketingContainer>
        <MinimalHeading
          eyebrow="How it works"
          heading="Live in three steps"
          body="From nothing to a published page in a couple of minutes."
        />
        <ol className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex flex-col">
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-zinc-900 ring-1 ring-zinc-950/10">
                {i + 1}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-zinc-900">
                {step.title}
              </h3>
              <p className="mt-2 leading-7 text-zinc-500">{step.body}</p>
            </li>
          ))}
        </ol>
      </MarketingContainer>
    </section>
  );
}
