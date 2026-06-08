import './globals.css';
import MarketingFooter from '@/components/marketing-footer';
import MarketingNavigation from '@/components/marketing-navigation';
import { LoginWidget } from '@trylinky/common';
import { buildOrganizationSchema, buildWebSiteSchema, serializeJsonLd } from '@trylinky/seo';
import { Button } from '@trylinky/ui';
import { Analytics } from '@vercel/analytics/react';
import { Metadata } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import { ReactNode } from 'react';

const seasonFont = localFont({
  src: './ssn.woff2',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Linky - A delightfully rich link-in-bio.',
  description:
    'Create your own dynamic link in bio page effortlessly with Linky, the personal page builder designed to help you stand out and connect with your audience.',
  metadataBase: new URL('https://lin.ky'),
  openGraph: {
    images: [
      {
        url: 'https://lin.ky/assets/og.png',
      },
    ],
    type: 'website',
    url: 'https://lin.ky',
    title: 'Linky',
    description:
      'Create your own dynamic link in bio page effortlessly with Linky, the personal page builder designed to help you stand out and connect with your audience.',
    siteName: 'Linky',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@trylinky',
    creator: '@trylinky',
    images: 'https://lin.ky/assets/og.png',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={seasonFont.className}>
      <head>
        {process.env.NODE_ENV === 'production' && (
          <Script
            src="https://analytics.ahrefs.com/analytics.js"
            data-key="uOVisnglxzaKbI/UovGA7w"
            defer={true}
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(
              buildOrganizationSchema({
                name: 'Linky',
                url: 'https://lin.ky',
                logo: 'https://lin.ky/assets/logo.png',
              })
            ),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(buildWebSiteSchema({ name: 'Linky', url: 'https://lin.ky' })),
          }}
        />
      </head>
      <body className="min-h-screen">
        <MarketingNavigation>
          <>
            <LoginWidget
              trigger={
                <Button variant="ghost" className="block rounded-full">
                  Log in
                </Button>
              }
            />
            <LoginWidget
              isSignup
              trigger={
                <Button className="block rounded-full">Get started</Button>
              }
            />
          </>
        </MarketingNavigation>
        <main className="min-h-full">{children}</main>
        <MarketingFooter />
      </body>

      <Analytics />
    </html>
  );
}
