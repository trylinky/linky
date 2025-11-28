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
    <div className="bg-[#e3dfd2] rounded-xl overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
        <div className="flex-1 flex flex-col gap-2 col-span-1 max-w-md py-8 md:py-16 px-8">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            Let&apos;s build your page
          </h2>
          <p className="text-base md:text-xl">
            Creating your first page and getting it live takes a matter of
            minutes. Let&apos;s start with your username.
          </p>

          <div className="mt-6">
            <div className="w-full md:w-auto inline-flex flex-row items-center rounded-full bg-white pl-4 border border-slate-200 shadow-sm">
              <span className="text-slate-600 font-medium">lin.ky/</span>
              <input
                type="text"
                placeholder="name"
                className="bg-transparent border-0 px-0 focus:outline-none focus:ring-0 rounded-full w-full"
              />
              <LoginWidget
                isSignup
                trigger={
                  <Button
                    variant="default"
                    size="xl"
                    className="font-bold flex group rounded-full px-6 md:px-10"
                  >
                    Claim Page
                    <ArrowRightIcon className="w-5 h-5 ml-2 -mr-6 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:-mr-4 transition-all ease-in-out duration-200" />
                  </Button>
                }
              />
            </div>
          </div>
        </div>
        <div className="flex-1 w-full h-[400px] relative overflow-hidden bg-[#e3dfd2]">
          <div className="absolute inset-0 -left-8 flex gap-2 rotate-45">
            <ScrollingColumn delay={0} />
            <ScrollingColumn delay={1} reverse />
            <ScrollingColumn delay={2} />
            <ScrollingColumn delay={3} reverse />
            <ScrollingColumn delay={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
