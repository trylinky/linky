'use client';

import { Button } from '@trylinky/ui';

const TikTokMark = () => {
  return (
    <svg
      viewBox="0 0 523 600"
      width={16}
      height={16}
      fill="none"
      className="mr-4 -ml-3"
    >
      <path
        fill="#fff"
        d="M444.42 120.81A143.38 143.38 0 0 1 379.18.75h-103L276 413.41a86.497 86.497 0 0 1-105.357 81.095A86.5 86.5 0 0 1 189.62 323.6a85.304 85.304 0 0 1 25.54 4V222.48a188.807 188.807 0 0 0-25.54-1.85C85.11 220.63.09 305.63.09 410.15a189.818 189.818 0 0 0 189.57 189.53c104.5 0 189.52-85 189.52-189.53V200.9A244.85 244.85 0 0 0 522.43 247V144a142.406 142.406 0 0 1-78.01-23.19Z"
      />
    </svg>
  );
};

export function TikTokLoginButton({
  className,
  action,
}: {
  className?: string;
  action: () => Promise<string>;
}) {
  const handleClick = async () => {
    const orchestrationId = await action();

    const baseUrl = new URL('/auth/signin', window.location.origin);
    baseUrl.searchParams.set('redirectTo', `/i/tiktok/${orchestrationId}`);
    baseUrl.searchParams.set('provider', 'tiktok');
    window.location.href = baseUrl.toString();
  };

  return (
    <Button
      variant="default"
      size="xl"
      onClick={handleClick}
      className={className}
    >
      <TikTokMark />
      Log in with TikTok
    </Button>
  );
}
