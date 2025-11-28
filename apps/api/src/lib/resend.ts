import { config } from '@/modules/features';
import { Resend } from 'resend';

export const createResendClient = () => {
  if (!config.resend.enabled) {
    console.info('Resend is not enabled, skipping client creation');
    return null;
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND API KEY is not set');
    return null;
  }

  return new Resend(process.env.RESEND_API_KEY);
};

export const createContact = async (email: string) => {
  const resend = createResendClient();

  if (!resend) {
    return;
  }

  if (!process.env.RESEND_AUDIENCE_ID) {
    console.warn('RESEND AUDIENCE ID is not set');
    return;
  }

  return resend.contacts.create({
    email,
    unsubscribed: false,
    audienceId: process.env.RESEND_AUDIENCE_ID as string,
  });
};
