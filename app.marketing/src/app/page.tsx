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
import styles from '@/components/landing-page/styles.module.scss';
import { SpotifyPlayingNowMockup } from '@/components/landing-page/ui-mockups';
import { MarketingContainer } from '@/components/marketing-container';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { LoginWidget } from '@trylinky/common';
import { Button, cn } from '@trylinky/ui';
import Image from 'next/image';
import Link from 'next/link';

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

export default async function LandingPage() {
  const featuredPages = await getFeaturedPages();

  return (
    <div className="min-h-screen overflow-x-hidden">
      <section className="pt-48 pb-16 bg-gradient-to-b from-[#f9f9f8] to-[#f5f3ea]">
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
                    <span
                      key={color}
                      style={{ color: color }}
                      className="inline"
                    >
                      {'delightfully'.charAt(index)}
                    </span>
                  ))}
                </span>{' '}
                <span className={styles.titleSecondPart}>
                  rich link-in-bio.
                </span>
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

      <section className="my-20 md:mt-24 md:mb-48">
        <MarketingContainer>
          <h2 className="text-3xl font-black tracking-tight text-center mb-2">
            Integrates with your favorite platforms
          </h2>
          <p className="text-base md:text-lg text-pretty mb-10 text-center">
            Show live follower stats, photos, videos and more.
          </p>

          <div className="flex flex-wrap gap-8 md:gap-14 justify-center items-center">
            <img
              src={logoYoutube.src}
              alt="YouTube logo"
              className="max-w-[100px] max-h-6"
            />
            <img
              src={logoX.src}
              alt="X logo"
              className="max-w-[100px] max-h-6"
            />
            <img
              src={logoGithub.src}
              alt="GitHub logo"
              className="max-w-[100px] max-h-6"
            />
            <img
              src={logoInstagram.src}
              alt="Instagram logo"
              className="max-w-[100px] max-h-6"
            />
            <img
              src={logoSpotify.src}
              alt="Spotify logo"
              className="max-w-[100px] max-h-6"
            />
            <img
              src={logoThreads.src}
              alt="Threads logo"
              className="max-w-[100px] max-h-6"
            />
            <img
              src={logoTiktok.src}
              alt="TikTok logo"
              className="max-w-[100px] max-h-6"
            />
          </div>
        </MarketingContainer>
      </section>

      <section className="my-20">
        <MarketingContainer>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
            The ultimate link-in-bio
          </h2>
          <p className="text-base md:text-lg text-pretty">
            Use our drag-and-drop builder to create your page.
          </p>
          <div className="mt-8 md:mt-16 sm:h-auto relative w-full h-full [--radius:theme(borderRadius.xl)]">
            <div className="absolute -inset-[var(--padding)] rounded-[calc(var(--radius)+var(--padding))] shadow-sm ring-1 ring-black/5 [--padding:theme(spacing.2)]"></div>
            <video
              autoPlay
              muted
              loop
              playsInline
              className="h-full rounded-[var(--radius)] w-full shadow-2xl ring-1 ring-black/10"
            >
              <source
                src="/i/assets/landing-page/landing-page-demo.mp4"
                type="video/mp4"
              />
            </video>
          </div>
        </MarketingContainer>
      </section>

      <section className="py-20 md:py-16 bg-[#f5f3ea]">
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
      </section>

      <section className="py-20">
        <MarketingContainer>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
            Explore
          </h2>
          <Link
            href="/i/explore"
            className="inline-block text-base text-slate-600 mb-8"
          >
            View all →
          </Link>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-2 gap-y-4 w-[calc(100%+2rem)] -ml-4 overflow-x-auto no-scrollbar">
            <div className="w-auto flex gap-4 py-8">
              {featuredPages.map((page) => {
                return (
                  <Link
                    key={page.id}
                    href={`/${page.slug}`}
                    className="bg-transparent hover:bg-slate-100 transition-colors px-4 py-4 rounded-xl min-w-96"
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
        </MarketingContainer>
      </section>

      <section className="py-24 bg-[#282723]">
        <MarketingContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10">
            <div className="w-full px-8 py-8 md:py-16 bg-gradient-to-tr from-[#4e54c8] to-[#8f94fb] rounded-xl">
              <SpotifyPlayingNowMockup
                className="!border-black/10"
                variant="kites"
              />
            </div>
            <div className="flex flex-col items-start gap-2">
              <span className="text-xs font-bold uppercase bg-yellow-300 text-yellow-900 px-2 py-1 rounded-full">
                New
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                New Block: Spotify
              </h2>
              <p className="text-base md:text-lg text-pretty text-white">
                With live blocks, you can share things like what you&apos;re
                currently listening to on Spotify, or your latest Instagram
                post.
              </p>
            </div>
          </div>
        </MarketingContainer>
      </section>

      <section className="my-24">
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

      <section className="py-8 md:py-24 bg-gradient-to-b from-[#FCFBF8] to-[#f5f3ea]">
        <MarketingContainer>
          <CallToActionBlock />
        </MarketingContainer>
      </section>
    </div>
  );
}
