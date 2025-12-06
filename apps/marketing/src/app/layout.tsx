import './globals.css';
import MarketingFooter from '@/components/marketing-footer';
import MarketingNavigation from '@/components/marketing-navigation';
import { LoginWidget } from '@trylinky/common';
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
  title: 'Kiko - Die kreative Lösung für Tagesmütter und Väter',
  description:
    'Erstelle deine eigene professionelle Seite in Minuten. Kiko hilft dir, dich zu präsentieren, Anfragen zu verwalten und mehr Zeit für die Kinder zu haben.',
  metadataBase: new URL('https://kiko.app'),
  openGraph: {
    images: [
      {
        url: 'https://kiko.app/assets/og.png',
      },
    ],
    type: 'website',
    url: 'https://kiko.app',
    title: 'Kiko',
    description:
      'Erstelle deine eigene professionelle Seite in Minuten. Kiko hilft dir, dich zu präsentieren, Anfragen zu verwalten und mehr Zeit für die Kinder zu haben.',
    siteName: 'Kiko',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@kiko',
    creator: '@kiko',
    images: 'https://kiko.app/assets/og.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="de" className={seasonFont.className} suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === 'production' && (
          <Script
            src="https://analytics.ahrefs.com/analytics.js"
            data-key="uOVisnglxzaKbI/UovGA7w"
            defer={true}
          />
        )}
      </head>
      <body className="min-h-screen">
        <MarketingNavigation>
          <>
            <LoginWidget
              trigger={
                <Button variant="ghost" className="block rounded-full">
                  Anmelden
                </Button>
              }
            />
            <LoginWidget
              isSignup
              trigger={
                <Button className="block rounded-full">Kostenlos starten</Button>
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
