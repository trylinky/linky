import './globals.css';
import MarketingFooter from '@/components/marketing-footer';
import MarketingNavigation from '@/components/marketing-navigation';
import { SITE_DESCRIPTION } from '@/lib/seo-metadata';
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  serializeJsonLd,
} from '@trylinky/seo';
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
  description: SITE_DESCRIPTION,
  metadataBase: new URL('https://lin.ky'),
  openGraph: {
    images: [
      {
        url: 'https://lin.ky/assets/og.png',
      },
    ],
    type: 'website',
    title: 'Linky',
    description: SITE_DESCRIPTION,
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
                description:
                  'Linky is an open-source link-in-bio builder with live content blocks, custom themes and custom domains.',
                sameAs: [
                  'https://x.com/trylinky',
                  'https://github.com/trylinky/linky',
                  'https://www.instagram.com/trylinky',
                ],
              })
            ),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(
              buildWebSiteSchema({ name: 'Linky', url: 'https://lin.ky' })
            ),
          }}
        />
      </head>
      <body className="min-h-screen antialiased bg-[#FBFAF7]">
        <MarketingNavigation />
        <main className="min-h-full">{children}</main>
        <MarketingFooter />

        <Script
          src="https://aside.so/s.js"
          data-id="5c0xpxpjkfdf"
          strategy="afterInteractive"
        />
      </body>

      <Analytics />
    </html>
  );
}
