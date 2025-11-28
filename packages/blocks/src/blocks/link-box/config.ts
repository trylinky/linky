import * as Yup from 'yup';

export interface LinkBoxBlockConfig {
  title: string;
  label: string;
  icon: {
    src: string;
  };
  link: string;
  showPreview: boolean;
}

export const linkBoxBlockDefaults: LinkBoxBlockConfig = {
  icon: {
    src: 'https://cdn.lin.ky/default-data/x-logo.png',
  },
  link: 'https://x.com/trylinky',
  title: 'X',
  label: 'Follow us on X',
  showPreview: false,
};

export const LinkBoxSchema = Yup.object().shape({
  title: Yup.string().required('Please provide a title'),
  label: Yup.string(),
  link: Yup.string().required('Please provide a link'),
  icon: Yup.object().shape({
    src: Yup.string().required('Please provide an icon'),
  }),
  showPreview: Yup.boolean().optional(),
});
