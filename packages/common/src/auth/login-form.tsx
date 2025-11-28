'use client';

import { auth } from '../auth/auth';
import { LoginProviderButton } from './login-provider-button';
import { Button, Input, toast } from '@trylinky/ui';
import { useState } from 'react';

interface Props {
  onComplete?: () => void;
  redirectTo?: string;
}

export function LoginForm({
  onComplete,
  redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/edit`,
}: Props) {
  const [email, setEmail] = useState('');

  console.log('redirectTo', redirectTo);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || email === '') {
      toast({
        title: 'Please enter your email',
      });
      return;
    }

    const { data, error } = await auth.signIn.magicLink({
      email,
      callbackURL: redirectTo,
    });

    if (error || !data.status) {
      console.log(error);
      return;
    }

    window.location.href = '/i/auth/verify';

    if (onComplete) {
      onComplete();
    }

    return;
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <form onSubmit={handleEmailSubmit}>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <Button size="lg" type="submit" className="w-full mt-4">
          Continue with Email
        </Button>
      </form>
      <div className="flex items-center my-4">
        <span className="h-[1px] w-full bg-zinc-200" />
        <span className="text-zinc-400 text-sm mx-4 uppercase font-semibold">
          Or
        </span>
        <span className="h-[1px] w-full bg-zinc-200" />
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <LoginProviderButton
          provider="twitter"
          className="mt-2 md:mt-0"
          redirectTo={redirectTo}
        />
        <LoginProviderButton provider="google" redirectTo={redirectTo} />
        <LoginProviderButton provider="tiktok" redirectTo={redirectTo} />
      </div>
    </div>
  );
}
