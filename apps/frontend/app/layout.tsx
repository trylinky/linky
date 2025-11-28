import './globals.css';
import './react-grid-layout.scss';
import { getSession } from '@/app/lib/auth';
import { PostHogIdentify, PostHogProvider } from '@/app/posthog-provider';
import { Toaster } from '@trylinky/ui';
import { Analytics } from '@vercel/analytics/react';
import { Metadata } from 'next';
import localFont from 'next/font/local';
import { headers } from 'next/headers';
import Script from 'next/script';

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
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  const sessionData = session.data;

  const { user } = sessionData ?? {};

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
      </head>
      <PostHogProvider>
        <body className="bg-stone-50 min-h-screen relative">
          {children}
          <Toaster />
        </body>
        {user && (
          <PostHogIdentify
            userId={user.id}
            organizationId={sessionData?.session.activeOrganizationId ?? ''}
          />
        )}
      </PostHogProvider>
      <Analytics />
    </html>
  );
}
