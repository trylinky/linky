import { Testimonials } from '@/components/landing-page/testimonials';
import { MarketingContainer } from '@/components/marketing-container';

export function TestimonialsSection() {
  return (
    <section className="pt-24 bg-gradient-to-b from-transparent to-white">
      <MarketingContainer className="">
        <div className="max-w-4xl mx-auto text-center mb-8 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Built by creators, for creators
          </h2>
          <p className="text-base md:text-lg text-pretty">
            Linky is trusted by over 3000 creators to power their link-in-bio.
          </p>
        </div>

        <div className="relative">
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            <Testimonials />
          </div>
          <div className="w-full h-[100px] bg-gradient-to-b from-transparent to-white absolute bottom-0 left-0 z-10" />
        </div>
      </MarketingContainer>
    </section>
  );
}
