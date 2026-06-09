import { MarketingContainer } from '@/components/marketing-container';
import { MinimalHeading } from '@/components/minimal-heading';
import { ComparisonGlance } from '@/components/pseo/comparison-glance';
import { ComparisonTable } from '@/components/pseo/comparison-table';
import { PseoBenefits } from '@/components/pseo/pseo-benefits';
import { PseoFeatureSections } from '@/components/pseo/pseo-feature-sections';
import { PseoLayout } from '@/components/pseo/pseo-layout';
import { MinimalHero } from '@/components/pseo/pseo-minimal-hero';
import { getAlternative, getAlternativeSlugs } from '@/content/alternatives';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamicParams = false;

export function generateStaticParams() {
  return getAlternativeSlugs().map((competitor) => ({ competitor }));
}

export async function generateMetadata(props: {
  params: Promise<{ competitor: string }>;
}): Promise<Metadata> {
  const { competitor } = await props.params;
  const c = getAlternative(competitor);
  if (!c) return {};
  return buildPseoMetadata({
    title: `${c.h1} | Linky`,
    description: c.answer,
    path: `/i/alternatives/${c.slug}`,
  });
}

function SwitchSteps({ competitor }: { competitor: string }) {
  const steps = [
    {
      title: 'Claim your username',
      body: 'Your page is live at lin.ky/yourname the moment you sign up. Free, no credit card.',
    },
    {
      title: 'Rebuild your links',
      body: 'Add a block for each link, connect your integrations, and pick a theme. Most pages take a few minutes.',
    },
    {
      title: 'Update your bios',
      body: `Swap your ${competitor} link for your new one on Instagram, TikTok, and everywhere else. Done.`,
    },
  ];
  return (
    <section className="border-t border-zinc-950/5 bg-[#FAFAF9] py-20 md:py-28">
      <MarketingContainer>
        <MinimalHeading
          eyebrow="Make the switch"
          heading={`Switching from ${competitor} takes minutes`}
        />
        <ol className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
          {steps.map((step, i) => (
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

export default async function AlternativePage(props: {
  params: Promise<{ competitor: string }>;
}) {
  const { competitor } = await props.params;
  const c = getAlternative(competitor);
  if (!c) notFound();

  const breadcrumbs = [
    { name: 'Home', url: 'https://lin.ky' },
    { name: 'Alternatives', url: 'https://lin.ky/i/alternatives' },
    { name: c.competitor, url: `https://lin.ky/i/alternatives/${c.slug}` },
  ];

  return (
    <PseoLayout faqs={c.faqs} minimal>
      <MinimalHero
        eyebrow={`${c.competitor} alternative`}
        h1={c.h1}
        answer={c.answer}
        breadcrumbs={breadcrumbs}
        secondaryHref="#comparison"
        secondaryLabel="See the comparison"
        visual={<ComparisonGlance competitor={c.competitor} rows={c.comparison} />}
      />

      <section
        id="comparison"
        className="scroll-mt-24 border-t border-zinc-950/5 bg-white py-20 md:py-28"
      >
        <MarketingContainer>
          <MinimalHeading
            eyebrow="Side by side"
            heading={`Linky vs ${c.competitor}`}
            body="A fair look at how the two compare, feature by feature."
          />
          <div className="mt-10">
            <ComparisonTable competitor={c.competitor} rows={c.comparison} minimal />
          </div>
        </MarketingContainer>
      </section>

      <SwitchSteps competitor={c.competitor} />

      <PseoBenefits heading="Why creators switch to Linky" minimal />

      <PseoFeatureSections sections={c.sections} minimal />
    </PseoLayout>
  );
}
