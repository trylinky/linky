import { MarketingContainer } from '@/components/marketing-container';
import Image from 'next/image';

export const MissionSection = () => {
  return (
    <section className="py-20 md:py-32 bg-[#FDF8F3] relative overflow-hidden">
        {/* Decorative elements */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
         <div className="absolute top-0 left-0 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />

      <MarketingContainer>
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
          <div className="w-full md:w-1/2 relative">
             <div className="absolute inset-0 bg-gradient-to-tr from-orange-200 to-purple-200 rounded-[2rem] transform rotate-3 scale-105 opacity-50 blur-sm" />
            <Image
              src="/i/images/watercolor-playing.png"
              alt="Kinder spielen"
              width={600}
              height={600}
              className="rounded-[2rem] shadow-2xl relative z-10 w-full h-auto object-cover transform transition-transform hover:scale-[1.02] duration-500"
            />
          </div>
          <div className="w-full md:w-1/2">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
              Weil du mehr bist als <span className="text-[#F6851E]">&quot;nur Betreuung&quot;</span>.
            </h2>
            <div className="space-y-6 text-lg md:text-xl text-slate-700 leading-relaxed font-light">
              <p>
                Tagesmütter und -väter sind das Rückgrat unserer Gesellschaft. Ihr leistet wertvolle Bildungsarbeit, oft allein und mit wenig Lobby.
              </p>
              <p>
                Kiko wurde entwickelt, um euch sichtbar zu machen, euch den Rücken freizuhalten und euch die professionelle Bühne zu geben, die ihr verdient.
              </p>
              <p className="font-bold text-slate-900 text-2xl">
                Damit ihr euch auf das konzentrieren könnt, was zählt: Die Kinder.
              </p>
            </div>
          </div>
        </div>
      </MarketingContainer>
    </section>
  );
};
