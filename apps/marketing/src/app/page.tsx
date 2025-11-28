import { getFeaturedPages } from '@/actions/get-featured-pages';
import logoGithub from '@/assets/landing-page/logo-github.svg';
import logoInstagram from '@/assets/landing-page/logo-instagram.svg';
import logoSpotify from '@/assets/landing-page/logo-spotify.svg';
import logoThreads from '@/assets/landing-page/logo-threads.svg';
import logoTiktok from '@/assets/landing-page/logo-tiktok.svg';
import logoX from '@/assets/landing-page/logo-x.svg';
import logoYoutube from '@/assets/landing-page/logo-youtube.svg';
import { CallToActionBlock } from '@/components/landing-page/CallToActionBlock';
import { FrequentlyAskedQuestions } from '@/components/landing-page/Faq';
import { InlineShowcaseSection } from '@/components/landing-page/sections/InlineShowcaseSection';
import { BlocksGrid } from '@/components/landing-page/sections/blocks-grid';
import {
  ExpandedFeaturesSection,
  FeaturesSection,
} from '@/components/landing-page/sections/features';
import Hero from '@/components/landing-page/sections/hero';
import { TestimonialsSection } from '@/components/landing-page/sections/testimonials';
import styles from '@/components/landing-page/styles.module.scss';
import { Testimonials } from '@/components/landing-page/testimonials';
import { MarketingContainer } from '@/components/marketing-container';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { LoginWidget } from '@trylinky/common';
import { Button, cn, TextReveal } from '@trylinky/ui';
// import { motion, useTransform, useScroll } from 'framer-motion'; // Moved
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export default async function LandingPage() {
  const featuredPages = await getFeaturedPages();

  return (
    <div className="min-h-screen">
      <Hero />
      <BlocksGrid />
      <InlineShowcaseSection />
      <FeaturesSection />
      <ExpandedFeaturesSection />

      <TestimonialsSection />

      {/* <section className="pb-20">
        <MarketingContainer>
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="flex flex-col items-center mb-8"></div>
            <blockquote
              className="text-2xl md:text-3xl font-semibold text-[#222] mb-8 leading-snug"
              style={{ fontVariationSettings: "'SERF' 10, 'wght' 500" }}
            >
              "I really value how Linky compliments my aesthetic while giving me
              the flexibility I need to showcase my work."
            </blockquote>
            <div className="flex items-center gap-3 mt-4">
              <Image
                src="https://cdn.glow.as/block-7c7149ca-6cc6-4975-be45-94af3eeb8c2f/f7b2b41b-eb7d-47c4-960a-5a21283a9aa4.webp"
                alt="de LVCɅ"
                width={48}
                height={48}
                className="rounded-full"
              />
              <div className="text-left">
                <div className="font-semibold text-base text-[#222]">
                  de LVCɅ
                </div>
                <div className="text-sm text-[#555]">lin.ky/delucax99</div>
              </div>
            </div>
          </div>
        </MarketingContainer>
      </section> */}
      {/* 
      <section className="py-20 md:py-16 bg-white">
        <MarketingContainer>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-8">
            What makes Linky special?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 w-full">
            <div className="w-full bg-[#e2e5ea] bg-gradient-to-tr from-[#607166] to-[#87a290] border border-stone-200 md:row-span-2 overflow-hidden rounded-xl flex flex-col justify-between">
              <Image
                src="/i/assets/landing-page/dynamic.png"
                width={789}
                height={1311}
                className="w-full border-b border-stone-100"
                alt=""
              />
              <div className="py-3 px-4 bg-white flex-1 flex flex-col justify-center">
                <h3 className="text-lg font-black tracking-tight mb-1">
                  Dynamic
                </h3>
                <p className="text-base text-black/80">
                  Linky does the hard work for you, fetching all of the latest
                  content to keep your page fresh.
                </p>
              </div>
            </div>
            <div className="w-full bg-gradient-to-tr from-[#4e54c8] to-[#8f94fb] border border-stone-200 overflow-hidden rounded-xl flex flex-col justify-between md:col-span-2">
              <Image
                src="/i/assets/landing-page/drag.png"
                width={789}
                height={294}
                className="w-full border-b border-stone-100"
                alt=""
              />
              <div className="py-3 px-4 bg-white flex-1 flex flex-col justify-center">
                <h3 className="text-lg font-black tracking-tight mb-1">
                  Drag & drop
                </h3>
                <p className="text-base text-black/80">
                  Build your page block by block in minutes.
                </p>
              </div>
            </div>
            <div className="w-full bg-gradient-to-tr from-[#fc4a1a] to-[#f7b733] border border-stone-200 overflow-hidden rounded-xl flex flex-col justify-between">
              <Image
                width={789}
                height={479}
                src="/i/assets/landing-page/themes.png"
                className="w-full border-b border-stone-100"
                alt=""
              />
              <div className="py-3 px-4 bg-white flex-1 flex flex-col justify-center">
                <h3 className="text-lg font-black tracking-tight mb-1">
                  Customizable
                </h3>
                <p className="text-base text-black/80">
                  With a few clicks, you can customize the look and feel of your
                  page.
                </p>
              </div>
            </div>
            <div className="w-full  bg-gradient-to-tr from-[#282337] to-[#434665] border border-stone-200 overflow-hidden rounded-xl flex flex-col justify-between">
              <Image
                width={789}
                height={479}
                src="/i/assets/landing-page/devices.png"
                className="w-full border-b border-stone-100"
                alt=""
              />
              <div className="py-3 px-4 bg-white flex-1 flex flex-col justify-center">
                <h3 className="text-lg font-black tracking-tight mb-1">
                  Works everywhere
                </h3>
                <p className="text-base text-black/80">
                  Your page will look great on mobile and desktop.
                </p>
              </div>
            </div>
          </div>
        </MarketingContainer>
      </section> */}

      {/* <section className="pt-24 pb-8">
        <MarketingContainer>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
            Featured pages
          </h2>
          <Link
            href="/i/explore"
            className="inline-block text-base text-slate-600 mb-8"
          >
            View all →
          </Link>
        </MarketingContainer>
        <div className="rounded-xl bg-gradient-to-b from-[#f5f3ea] to-[#ffeee2]">
          <div
            className="w-full overflow-x-auto no-scrollbar snap-x snap-mandatory"
            style={{
              paddingLeft:
                'max(env(safe-area-inset-left), calc((100vw - 1152px) / 2))',
              paddingRight:
                'max(env(safe-area-inset-right), calc((100vw - 1152px) / 2))',
            }}
          >
            <div className="flex gap-4 py-8 min-w-max">
              {featuredPages.map((page) => {
                return (
                  <Link
                    key={page.id}
                    href={`/${page.slug}`}
                    className="bg-transparent hover:bg-black/5 transition-colors px-4 py-4 rounded-xl w-[384px] flex-shrink-0 snap-start"
                  >
                    <Image
                      src={`${process.env.NEXT_PUBLIC_APP_URL}/${page.slug}/opengraph-image`}
                      alt=""
                      width={1200}
                      height={630}
                      className="rounded-xl"
                    />
                    <div className="flex flex-col mt-3">
                      <h3 className="text-lg font-bold">{page.headerTitle}</h3>
                      <p className="text-sm text-slate-500">
                        {page.headerDescription}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section> */}

      <section className="py-8 md:py-24 bg-white">
        <MarketingContainer>
          <CallToActionBlock />
        </MarketingContainer>
      </section>

      <section className="py-24 bg-white">
        <MarketingContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Frequently Asked <br /> Questions
            </h2>
            <div className="flex flex-col items-start w-full flex-1 gap-4">
              <FrequentlyAskedQuestions questionSet="landing-page" />
              <Link href="/i/learn" className="text-sm text-slate-600">
                View more →
              </Link>
            </div>
          </div>
        </MarketingContainer>
      </section>
    </div>
  );
}
