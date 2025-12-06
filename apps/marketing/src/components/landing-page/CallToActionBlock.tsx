import styles from './call-to-action-block.module.css';
import preview1 from '@/assets/landing-page/previews/1.png';
import preview2 from '@/assets/landing-page/previews/2.png';
import preview3 from '@/assets/landing-page/previews/3.png';
import preview4 from '@/assets/landing-page/previews/4.png';
import preview5 from '@/assets/landing-page/previews/5.png';
import preview6 from '@/assets/landing-page/previews/6.png';
import preview7 from '@/assets/landing-page/previews/7.png';
import preview8 from '@/assets/landing-page/previews/8.png';
import preview9 from '@/assets/landing-page/previews/9.png';
import preview10 from '@/assets/landing-page/previews/10.png';
import preview11 from '@/assets/landing-page/previews/11.png';
import preview12 from '@/assets/landing-page/previews/12.png';
import preview13 from '@/assets/landing-page/previews/13.png';
import preview14 from '@/assets/landing-page/previews/14.png';
import preview15 from '@/assets/landing-page/previews/15.png';
import preview16 from '@/assets/landing-page/previews/16.png';
import preview17 from '@/assets/landing-page/previews/17.png';
import preview18 from '@/assets/landing-page/previews/18.png';
import preview19 from '@/assets/landing-page/previews/19.png';
import preview20 from '@/assets/landing-page/previews/20.png';
import preview21 from '@/assets/landing-page/previews/21.png';
import preview22 from '@/assets/landing-page/previews/22.png';
import preview23 from '@/assets/landing-page/previews/23.png';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { LoginWidget } from '@trylinky/common';
import { Button, cn } from '@trylinky/ui';
import Image from 'next/image';

const columns = [
  [preview1, preview8, preview15, preview22, preview4],
  [preview2, preview9, preview16, preview23, preview14],
  [preview3, preview10, preview17, preview19, preview6],
  [preview4, preview11, preview18, preview2, preview7],
  [preview5, preview12, preview20, preview21, preview13],
];

function ScrollingColumn({
  delay,
  reverse,
}: {
  delay: number;
  reverse?: boolean;
}) {
  const columnIndex = delay % columns.length;
  const columnImages = columns[columnIndex];

  return (
    <div
      className={cn(
        'flex flex-col h-auto min-h-[1000px] gap-2',
        reverse ? styles.animateScrollReverse : styles.animateScroll
      )}
    >
      {/* First set of images */}
      {columnImages.map((image, i) => (
        <Image
          key={`first-${i}`}
          src={image}
          width={1170}
          height={2532}
          alt=""
          className={cn('w-[120px] h-[308px] rounded-xl bg-black/20')}
        />
      ))}
      {/* Duplicate set for seamless loop */}
      {columnImages.map((image, i) => (
        <Image
          key={`second-${i}`}
          src={image}
          width={1170}
          height={2532}
          alt=""
          className={cn('w-[120px] h-[308px] rounded-xl')}
        />
      ))}
    </div>
  );
}

export function CallToActionBlock() {
  return (
    <div className="bg-[#e3dfd2] rounded-3xl overflow-hidden shadow-2xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-0">
        <div className="flex-1 flex flex-col gap-6 col-span-1 py-12 px-8 md:p-16 relative z-10 bg-[#e3dfd2]/90 backdrop-blur-sm lg:bg-transparent">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            Hol dir deine Freiheit zurück.
          </h2>
          <p className="text-lg md:text-xl text-slate-700 leading-relaxed">
            Erstelle in unter 30 Minuten eine professionelle Kiko-Seite direkt von deinem Handy, mit der du freie Plätze füllst, digitale Angebote verkaufst und strukturierte Anfragen erhältst – ohne Technikstress.
          </p>

          <div className="mt-4">
            <div className="w-full inline-flex flex-row items-center rounded-full bg-white pl-4 border border-slate-200 shadow-lg p-1">
              <span className="text-slate-500 font-medium pl-2 hidden sm:inline">kiko/</span>
              <input
                type="text"
                placeholder="dein-name"
                className="bg-transparent border-0 px-2 focus:outline-none focus:ring-0 rounded-full w-full text-slate-900 placeholder:text-slate-400"
              />
              <LoginWidget
                isSignup
                trigger={
                  <Button
                    variant="default"
                    size="xl"
                    className="font-bold flex group rounded-full px-6 md:px-8 py-6 text-lg shrink-0"
                  >
                    Jetzt Profil erstellen
                    <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                }
              />
            </div>
             <p className="text-xs text-slate-500 mt-4 leading-normal opacity-80 max-w-md">
                <strong className="font-semibold">100% Zufriedenheits-Garantie:</strong> Wenn deine Seite nach 30 Tagen nicht online ist und du keine einzige Anfrage über Kiko erhalten hast, erhältst du dein Geld zurück.
             </p>
          </div>
        </div>
        <div className="flex-1 w-full h-[300px] lg:h-[600px] relative overflow-hidden bg-[#e3dfd2]">
          <div className="absolute inset-0 -left-16 -top-16 w-[150%] h-[150%] flex gap-4 rotate-12 opacity-80 lg:opacity-100">
            <ScrollingColumn delay={0} />
            <ScrollingColumn delay={1} reverse />
            <ScrollingColumn delay={2} />
            <ScrollingColumn delay={3} reverse />
            <ScrollingColumn delay={4} />
          </div>
           {/* Fade overlay for mobile text readability if needed, though split layout handles it */}
        </div>
      </div>
    </div>
  );
}
