import styles from '@/components/landing-page/styles.module.scss';
import { MarketingContainer } from '@/components/marketing-container';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { LoginWidget } from '@trylinky/common';
import { Button, cn } from '@trylinky/ui';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

// Import the component

const colors = [
  '#8CC640',
  '#07B151',
  '#2FBBB3',
  '#2357BC',
  '#4C489B',
  '#733B97',
  '#AF3A94',
  '#D52127',
  '#F36621',
  '#F6851E',
  '#FBB40F',
  '#FCED23',
];

export default function Hero() {
  return (
    <section className="pt-48 pb-16 bg-gradient-to-b from-[#f5f3ea] to-[#fff]">
      <MarketingContainer>
        <div className="flex justify-center items-center">
          <div className="w-full max-w-lg text-center flex flex-col items-center">
            <h1
              className={cn(
                'text-5xl md:text-6xl font-black text-black tracking-tight justify-center',
                styles.title
              )}
            >
              <span className={styles.titleFirstPart}>The </span>
              <span className={cn('inline-flex', styles.titleRainbow)}>
                {colors.map((color, index) => (
                  <span key={color} style={{ color: color }} className="inline">
                    {'delightfully'.charAt(index)}
                  </span>
                ))}
              </span>{' '}
              <span className={styles.titleSecondPart}>rich link-in-bio.</span>
            </h1>

            <span
              className={cn(
                'text-xl md:text-[1.2rem] font-normal mt-3 md:mt-4 block text-[#241f3d]/80 text-pretty text-center',
                styles.subtitle
              )}
            >
              Linky is the open source link-in-bio that integrates with your
              favorite platforms to keep your page fresh.
            </span>

            <div
              className={cn(
                'mt-4 md:mt-8 flex flex-col items-start w-full',
                styles.ctas
              )}
            >
              <div className="w-full inline-flex flex-row items-center rounded-full bg-white pl-4 border border-slate-200 shadow-sm justify-center">
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
              <Button variant="link" asChild>
                <Link
                  href="/jack"
                  target="_blank"
                  className="text-slate-500 text-xs font-medium text-left pl-0"
                >
                  See an example page →
                </Link>
              </Button>
            </div>

            <div
              className={cn(
                'flex gap-4 items-center mt-4 md:mt-8',
                styles.socialProof
              )}
            >
              <div className="flex -space-x-1 overflow-hidden">
                <Image
                  width={28}
                  height={28}
                  className="inline-block h-7 w-7 rounded-full ring-2 ring-[##ebc7e2]"
                  src="https://cdn.lin.ky/block-4cc796c0-018b-46e7-af22-77e3ac421882/32b1a2eb-2a3f-4133-aee2-9b016bc38cc8"
                  alt=""
                />
                <Image
                  width={28}
                  height={28}
                  className="inline-block h-7 w-7 rounded-full ring-2 ring-[##ebc7e2]"
                  src="https://cdn.lin.ky/666b7445-c171-4ad7-a21d-eb1954b7bd40/0885d7ec-9af4-4430-94f4-ad1a033c2704"
                  alt=""
                />
                <Image
                  width={28}
                  height={28}
                  className="inline-block h-7 w-7 rounded-full ring-2 ring-[##ebc7e2]"
                  src="https://cdn.lin.ky/block-bda8e51a-9566-4fc0-88b8-0110937688b7/3155a632-e053-4c41-9d9e-a4092e98bcaf"
                  alt=""
                />
                <Image
                  width={28}
                  height={28}
                  className="inline-block h-7 w-7 rounded-full ring-2 ring-[##ebc7e2]"
                  src="https://cdn.lin.ky/block-9077b37e-2c6c-4457-aa30-13f44f38ec15/76af84b5-0e47-41fc-852b-458020c75d71"
                  alt=""
                />
              </div>
              <span className="text-xs font-medium text-slate-500 block">
                Trusted by 3000+ creators
              </span>
            </div>
          </div>
        </div>
      </MarketingContainer>
    </section>
  );
}
