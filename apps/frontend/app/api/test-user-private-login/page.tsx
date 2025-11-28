'use client';

import { auth } from '@/app/lib/auth';
import { Button } from '@trylinky/ui';
import Link from 'next/link';
import { FormEvent, useState } from 'react';

export default function TestUserPrivateLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!email || !password) {
      alert('Please enter your email and password');
    }

    await auth.signIn.email({
      email,
      password,
    });
  };

  return (
    <div className="w-full h-full min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">
        Login form for app review test users
      </h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 bg-slate-200 rounded-ld min-w-96 p-6"
      >
        <label className="flex flex-col">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
        </label>
        <label className="flex flex-col">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
        </label>
        <Button type="submit">Login</Button>
      </form>
      <div className="flex flex-row gap-2 mt-2 text-sm text-gray-500">
        <Link href="/i/privacy">Privacy Policy</Link>
        <Link href="/i/terms">Terms of Service</Link>
      </div>
    </div>
  );
}
