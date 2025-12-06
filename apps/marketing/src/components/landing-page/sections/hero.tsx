import styles from '@/components/landing-page/styles.module.scss';
import { MarketingContainer } from '@/components/marketing-container';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { LoginWidget } from '@trylinky/common';
import { Button, cn } from '@trylinky/ui';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export default function Hero() {
  return (
    <section className="pt-48 pb-16 bg-gradient-to-b from-[#f5f3ea] to-[#fff] overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.05]" />
      <MarketingContainer>
        <div className="flex justify-center items-center relative z-10">
          <div className="w-full max-w-3xl text-center flex flex-col items-center">
            <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-indigo-600 ring-1 ring-inset ring-indigo-600/10 bg-indigo-50 mb-6 animate-fade-in-up">
              Deine Online-Präsenz in 30 Minuten
            </div>
            <h1
              className={cn(
                'text-5xl md:text-7xl font-black text-slate-900 tracking-tight text-center leading-[1.1]',
                styles.title
              )}
            >
              Die kreative Lösung für{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Tagesmütter und Väter
              </span>
            </h1>

            <p
              className={cn(
                'text-xl md:text-2xl font-normal mt-6 md:mt-8 block text-slate-600 text-pretty text-center max-w-2xl mx-auto leading-relaxed',
                styles.subtitle
              )}
            >
              Fülle deine freien Plätze, verkaufe digitale Angebote und reduziere
              deinen bürokratischen Aufwand – alles direkt von deinem Handy.
            </p>

            <div
              className={cn(
                'mt-8 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full',
                styles.ctas
              )}
            >
              <LoginWidget
                isSignup
                trigger={
                  <Button
                    variant="default"
                    size="xl"
                    className="font-bold flex group rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    Kostenlos starten
                    <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                }
              />
              <Button
                variant="outline"
                size="xl"
                className="font-medium rounded-full px-8 py-6 text-lg border-2 hover:bg-slate-50"
                asChild
              >
                <Link href="/jack" target="_blank">
                  Beispielseite ansehen
                </Link>
              </Button>
            </div>

            <div
              className={cn(
                'flex flex-col sm:flex-row gap-4 items-center justify-center mt-12 opacity-0 animate-[fadeIn_0.5s_ease-out_0.5s_forwards]',
                styles.socialProof
              )}
            >
              <div className="flex -space-x-3 overflow-hidden">
                <Image
                  width={40}
                  height={40}
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-white"
                  src="https://cdn.lin.ky/block-4cc796c0-018b-46e7-af22-77e3ac421882/32b1a2eb-2a3f-4133-aee2-9b016bc38cc8"
                  alt=""
                />
                <Image
                  width={40}
                  height={40}
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-white"
                  src="https://cdn.lin.ky/666b7445-c171-4ad7-a21d-eb1954b7bd40/0885d7ec-9af4-4430-94f4-ad1a033c2704"
                  alt=""
                />
                <Image
                  width={40}
                  height={40}
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-white"
                  src="https://cdn.lin.ky/block-bda8e51a-9566-4fc0-88b8-0110937688b7/3155a632-e053-4c41-9d9e-a4092e98bcaf"
                  alt=""
                />
                <Image
                  width={40}
                  height={40}
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-white"
                  src="https://cdn.lin.ky/block-9077b37e-2c6c-4457-aa30-13f44f38ec15/76af84b5-0e47-41fc-852b-458020c75d71"
                  alt=""
                />
              </div>
              <div className="text-sm font-medium text-slate-600">
                <span className="font-bold text-slate-900 block sm:inline">
                  Bereits 3000+ Tageseltern
                </span>{' '}
                vertrauen uns
              </div>
            </div>
          </div>
        </div>
      </MarketingContainer>
    </section>
  );
}
