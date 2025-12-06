import { CallToActionBlock } from '@/components/landing-page/CallToActionBlock';
import { FrequentlyAskedQuestions } from '@/components/landing-page/Faq';
import { MarketingContainer } from '@/components/marketing-container';
import { PricingTable, auth } from '@trylinky/common';
import { Metadata } from 'next';
import { headers } from 'next/headers';


export const metadata: Metadata = {
  title: 'Preise | Kiko',
  description: 'Wähle das passende Paket für deine professionelle Webseite mit Kiko.',
};

export default async function PricingPage() {
  const headersList = await headers();

  const session = await auth.getSession({
    fetchOptions: {
      headers: headersList,
    },
  });

  return (
    <div className="bg-gradient-to-b from-[#f9f9f8] to-[#f5f3ea] pt-24 sm:pt-32 pb-8">
      <MarketingContainer className="text-center">
        <h1 className="text-pretty text-5xl lg:text-6xl font-black text-black tracking-tight">
          Investiere in deine Zukunft.
        </h1>
        <p className="mt-6 text-xl font-medium text-gray-600">
          Professionelle Werkzeuge für deinen Erfolg als Tagesmutter oder -vater.
        </p>
      </MarketingContainer>
      <section className="py-16">
        <PricingTable isLoggedIn={!!session?.data?.session} />
      </section>

      <section className="my-24">
        <MarketingContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Häufige Fragen
            </h2>
            <div className="flex flex-col items-start w-full flex-1 gap-4">
              <FrequentlyAskedQuestions questionSet="pricing" />
            </div>
          </div>
        </MarketingContainer>
      </section>

      <section className="py-8 md:py-16">
        <MarketingContainer>
          <CallToActionBlock />
        </MarketingContainer>
      </section>
    </div>
  );
}
