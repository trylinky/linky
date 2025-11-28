'use client';

import { LoginForm } from './login-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@trylinky/ui';
import { useState } from 'react';

interface Props {
  trigger: React.ReactNode;
  isSignup?: boolean;
}

export function LoginWidget({ trigger, isSignup }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isSignup ? 'Get started ' : 'Welcome back!'}
          </DialogTitle>
          <DialogDescription>
            {isSignup
              ? 'Create your account using one of the options below'
              : 'Login to your account below.'}
          </DialogDescription>
        </DialogHeader>

        <LoginForm onComplete={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
