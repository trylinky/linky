import preview3 from '@/assets/landing-page/previews/3.png';
import {
  GithubCommitsThisMonthMockup,
  SpotifyPlayingNowMockup,
} from '@/components/landing-page/ui-mockups';
import { MarketingContainer } from '@/components/marketing-container';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { LoginWidget } from '@trylinky/common';
import { Button } from '@trylinky/ui';
import Image from 'next/image';
import Link from 'next/link';

const RAINBOW = [
  '#8CC640', '#07B151', '#2FBBB3', '#2357BC', '#4C489B', '#733B97',
  '#AF3A94', '#D52127', '#F36621', '#F6851E', '#FBB40F', '#FCED23',
];

const AVATARS = [
  'https://cdn.lin.ky/block-4cc796c0-018b-46e7-af22-77e3ac421882/32b1a2eb-2a3f-4133-aee2-9b016bc38cc8',
  'https://cdn.lin.ky/666b7445-c171-4ad7-a21d-eb1954b7bd40/0885d7ec-9af4-4430-94f4-ad1a033c2704',
  'https://cdn.lin.ky/block-bda8e51a-9566-4fc0-88b8-0110937688b7/3155a632-e053-4c41-9d9e-a4092e98bcaf',
  'https://cdn.lin.ky/block-9077b37e-2c6c-4457-aa30-13f44f38ec15/76af84b5-0e47-41fc-852b-458020c75d71',
];

function HeroConfetti() {
  const shapes = [
    { c: '#07B151', t: '22%', l: '8%', s: 14, r: false },
    { c: '#FBB40F', t: '38%', l: '15%', s: 11, r: true },
    { c: '#2357BC', t: '14%', l: '80%', s: 10, r: false },
    { c: '#E8553F', t: '40%', l: '90%', s: 13, r: false },
    { c: '#733B97', t: '64%', l: '6%', s: 12, r: true },
    { c: '#2FBBB3', t: '60%', l: '93%', s: 10, r: false },
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0">
      {shapes.map((sh, i) => (
        <span
          key={i}
          className={sh.r ? 'absolute rounded-[4px]' : 'absolute rounded-full'}
          style={{
            top: sh.t,
            left: sh.l,
            width: sh.s,
            height: sh.s,
            backgroundColor: sh.c,
            transform: sh.r ? 'rotate(20deg)' : undefined,
          }}
        />
      ))}
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-zinc-950/5 bg-linear-to-b from-white to-[#F5F5F3] pt-36 md:pt-44">
      <HeroConfetti />
      <MarketingContainer>
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
          <h1 className="max-w-[24ch] text-5xl font-semibold tracking-tight text-zinc-900 text-balance md:text-6xl">
            The{' '}
            <span className="inline-flex">
              {RAINBOW.map((color, i) => (
                <span key={color} style={{ color }}>
                  {'delightfully'.charAt(i)}
                </span>
              ))}
            </span>{' '}
            rich link-in-bio.
          </h1>

          <p className="mt-5 max-w-[48ch] text-lg text-zinc-500 text-pretty md:text-xl">
            One link that holds everything you make. Live blocks keep it fresh
            so your page updates itself.
          </p>

          <div className="mt-8 w-full max-w-md">
            <div className="flex items-center gap-2 rounded-full bg-white p-2 pl-5 shadow-sm ring-1 ring-zinc-950/10">
              <span className="font-medium text-zinc-400">lin.ky/</span>
              <input
                type="text"
                placeholder="yourname"
                aria-label="Choose your username"
                className="min-w-0 flex-1 border-0 bg-transparent px-0 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-0"
              />
              <LoginWidget
                isSignup
                trigger={
                  <Button
                    size="xl"
                    className="group shrink-0 rounded-full bg-zinc-900 py-2 pl-4 pr-3 font-semibold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                  >
                    Claim page
                    <ArrowRightIcon className="ml-1.5 size-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                }
              />
            </div>
            <p className="mt-3 text-sm text-zinc-400">
              Free forever. No credit card.
            </p>
          </div>

          <div className="mt-7 flex items-center gap-3">
            <div className="flex -space-x-2 overflow-hidden">
              {AVATARS.map((src) => (
                <Image
                  key={src}
                  width={28}
                  height={28}
                  className="inline-block size-7 rounded-full ring-2 ring-white"
                  src={src}
                  alt=""
                />
              ))}
            </div>
            <span className="text-sm font-medium text-zinc-500">
              Trusted by 3,000+ creators
            </span>
          </div>
        </div>

        {/* Product visual - cropped device + floating live blocks */}
        <div className="relative z-10 mx-auto mt-14 h-[360px] w-full max-w-3xl overflow-hidden md:mt-16 md:h-[440px]">
          <div
            className="absolute left-1/2 top-10 hidden w-72 md:block"
            style={{ transform: 'translateX(-120%) rotate(-4deg)' }}
          >
            <SpotifyPlayingNowMockup className="shadow-xl" />
          </div>
          <div
            className="absolute left-1/2 top-24 hidden w-52 md:block"
            style={{ transform: 'translateX(35%) rotate(4deg)' }}
          >
            <GithubCommitsThisMonthMockup className="shadow-xl" />
          </div>

          <div className="mx-auto w-[260px] rounded-[2.6rem] bg-zinc-950 p-2.5 shadow-2xl shadow-zinc-900/25 ring-1 ring-black/10 md:w-[300px]">
            <div className="overflow-hidden rounded-[2.1rem] bg-zinc-50">
              <Image
                src={preview3}
                width={1170}
                height={2532}
                alt="A live Linky page"
                priority
                className="h-auto w-full"
              />
            </div>
          </div>

          {/* Fade the cropped device into the section edge */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-b from-transparent to-[#F5F5F3]"
          />
        </div>
      </MarketingContainer>
    </section>
  );
}
