import { Testimonials } from '@/components/landing-page/testimonials';
import { MarketingContainer } from '@/components/marketing-container';
import { MinimalHeading } from '@/components/minimal-heading';

export function TestimonialsSection() {
  return (
    <section className="border-t border-zinc-950/5 bg-white pt-20 md:pt-28">
      <MarketingContainer className="">
        <div className="mb-12 flex justify-center md:mb-16">
          <MinimalHeading
            center
            eyebrow="Testimonials"
            heading="Built by creators, for creators"
            body="Linky is trusted by over 3000 creators to power their link-in-bio."
          />
        </div>

        <div className="relative">
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            <Testimonials />
          </div>
          <div className="w-full h-[100px] bg-linear-to-b from-transparent to-white absolute bottom-0 left-0 z-10" />
        </div>
      </MarketingContainer>
    </section>
  );
}
