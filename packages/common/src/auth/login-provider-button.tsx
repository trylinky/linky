'use client';

import { auth } from '../auth/auth';
import { Button } from '@trylinky/ui';
import { ReactNode } from 'react';

type EnabledProviders = 'google' | 'twitter' | 'tiktok';

const providerIcons: Record<EnabledProviders, ReactNode> = {
  google: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.68 8.18183C15.68 7.61456 15.6291 7.06911 15.5345 6.54547H8V9.64002H12.3055C12.12 10.64 11.5564 11.4873 10.7091 12.0546V14.0618H13.2945C14.8073 12.6691 15.68 10.6182 15.68 8.18183Z"
        fill="#4285F4"
      ></path>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 16C10.16 16 11.9709 15.2837 13.2945 14.0618L10.7091 12.0546C9.99273 12.5346 9.07636 12.8182 8 12.8182C5.91636 12.8182 4.15272 11.4109 3.52363 9.52002H0.850906V11.5927C2.16727 14.2073 4.87272 16 8 16Z"
        fill="#34A853"
      ></path>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.52364 9.52001C3.36364 9.04001 3.27273 8.52729 3.27273 8.00001C3.27273 7.47274 3.36364 6.96001 3.52364 6.48001V4.40729H0.850909C0.309091 5.48729 0 6.70911 0 8.00001C0 9.29092 0.309091 10.5127 0.850909 11.5927L3.52364 9.52001Z"
        fill="#FBBC05"
      ></path>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 3.18182C9.17454 3.18182 10.2291 3.58545 11.0582 4.37818L13.3527 2.08364C11.9673 0.792727 10.1564 0 8 0C4.87272 0 2.16727 1.79273 0.850906 4.40727L3.52363 6.48C4.15272 4.58909 5.91636 3.18182 8 3.18182Z"
        fill="#EA4335"
      ></path>
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 248 204" width={16} height={16}>
      <path
        fill="currentColor"
        d="M221.95 51.29c.15 2.17.15 4.34.15 6.53 0 66.73-50.8 143.69-143.69 143.69v-.04c-27.44.04-54.31-7.82-77.41-22.64 3.99.48 8 .72 12.02.73 22.74.02 44.83-7.61 62.72-21.66-21.61-.41-40.56-14.5-47.18-35.07 7.57 1.46 15.37 1.16 22.8-.87-23.56-4.76-40.51-25.46-40.51-49.5v-.64c7.02 3.91 14.88 6.08 22.92 6.32C11.58 63.31 4.74 33.79 18.14 10.71c25.64 31.55 63.47 50.73 104.08 52.76-4.07-17.54 1.49-35.92 14.61-48.25 20.34-19.12 52.33-18.14 71.45 2.19 11.31-2.23 22.15-6.38 32.07-12.26-3.77 11.69-11.66 21.62-22.2 27.93 10.01-1.18 19.79-3.86 29-7.95-6.78 10.16-15.32 19.01-25.2 26.16z"
      />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 523 600" width={16} height={16} fill="none">
      <path
        fill="currentColor"
        d="M444.42 120.81A143.38 143.38 0 0 1 379.18.75h-103L276 413.41a86.497 86.497 0 0 1-105.357 81.095A86.5 86.5 0 0 1 189.62 323.6a85.304 85.304 0 0 1 25.54 4V222.48a188.807 188.807 0 0 0-25.54-1.85C85.11 220.63.09 305.63.09 410.15a189.818 189.818 0 0 0 189.57 189.53c104.5 0 189.52-85 189.52-189.53V200.9A244.85 244.85 0 0 0 522.43 247V144a142.406 142.406 0 0 1-78.01-23.19Z"
      />
    </svg>
  ),
};

const providerConfigs: Record<
  EnabledProviders,
  {
    id: string;
    name: string;
  }
> = {
  google: {
    id: 'google',
    name: 'Google',
  },
  twitter: {
    id: 'twitter',
    name: 'X / Twitter',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
  },
};

interface Props {
  provider: EnabledProviders;
  className?: string;
  variant?: 'glow' | 'default';
  size?: 'lg' | 'md';
  onClick?: () => Promise<void>;
  disabled?: boolean;
  shouldRedirect?: boolean;
  redirectTo?: string;
}

export function LoginProviderButton({
  provider,
  className,
  variant = 'default',
  size = 'md',
  onClick,
  disabled,
  redirectTo,
  shouldRedirect = true,
}: Props) {
  const prov = providerConfigs[provider];

  return (
    <Button
      type="submit"
      className="w-full"
      variant="secondary"
      onClick={async () => {
        if (disabled) {
          return;
        }

        if (onClick) {
          await onClick();
        }

        if (['google', 'twitter', 'tiktok'].includes(provider)) {
          await auth.signIn.social({
            provider,
            callbackURL:
              redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/edit`,
          });
        }
      }}
      disabled={disabled}
    >
      {providerIcons[provider]}
      <span className="ml-3">{prov.name}</span>
    </Button>
  );
}
