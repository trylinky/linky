import { signIn } from './auth';

type Provider = 'google' | 'twitter' | 'tiktok';

export const signInOauth = async (provider: Provider, redirectTo?: string) => {
  const data = await signIn.social({
    provider: provider as any,
    callbackURL: redirectTo,
  });

  return data;
};
