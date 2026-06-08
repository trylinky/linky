import { MarketingContainer } from '@/components/marketing-container';
import { Button } from '@trylinky/ui';
import Link from 'next/link';

export function PseoCtaGradient({
  headline = 'Ready to build your link in bio?',
  subtext = 'Create your free Linky page in minutes.',
}: {
  headline?: string;
  subtext?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-indigo-600 via-purple-600 to-pink-500 py-20 md:py-28">
      {/* Soft radial glow overlay */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255,255,255,0.20) 0%, transparent 70%)',
        }}
      />

      <MarketingContainer className="relative">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            {headline}
          </h2>
          <p className="mt-4 text-lg md:text-xl text-white/80">{subtext}</p>
          <Button
            asChild
            size="xl"
            className="mt-8 rounded-full bg-white text-gray-900 font-bold hover:bg-white/90"
          >
            <Link href="/i/auth/signup">Get started free</Link>
          </Button>
        </div>
      </MarketingContainer>
    </section>
  );
}
