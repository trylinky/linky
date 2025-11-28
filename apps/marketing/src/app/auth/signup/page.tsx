'use client';

import { useIsLoggedIn } from '@/hooks/use-is-logged-in';
import { LoginForm } from '@trylinky/common';
import Image from 'next/image';
import { redirect } from 'next/navigation';

export default function SignupPage() {
  const isLoggedIn = useIsLoggedIn();

  if (isLoggedIn) {
    redirect('/');
  }

  return (
    <section className="bg-muted min-h-screen py-16">
      <div className="mx-auto max-w-2xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Image
            width={40}
            height={40}
            src="/i/assets/logo.png"
            alt="Linky"
            className="mx-auto h-10 w-auto rounded-md mb-4"
          />

          <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
            Let&apos;s get started!
          </p>
        </div>

        <div className="flex flex-col items-center w-full max-w-lg mx-auto">
          <div className="mt-4 w-full flex-1 rounded-lg border bg-white px-8 py-8 shadow-sm dark:bg-zinc-950 text-center">
            <LoginForm />
          </div>
        </div>
      </div>
    </section>
  );
}
