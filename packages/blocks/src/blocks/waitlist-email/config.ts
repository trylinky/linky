import * as Yup from 'yup';

export interface WaitlistEmailBlockConfig {
  title: string;
  label: string;
  buttonLabel: string;
  waitlistId: string;
}

export const waitlistEmailBlockDefaults: WaitlistEmailBlockConfig = {
  title: 'Join waitlist',
  label: 'Get early access to a new feature',
  buttonLabel: 'Join',
  waitlistId: '',
};

export const WaitlistEmailBlockSchema = Yup.object().shape({
  title: Yup.string().required('Please provide a title'),
  label: Yup.string().required('Please provide a label'),
  buttonLabel: Yup.string().required('Please provide a button label'),
  waitlistId: Yup.string().required('Please provide your waitlist ID'),
});
