import * as Yup from 'yup';

export interface StackBlockConfig {
  title: string;
  label: string;
  items: {
    title: string;
    label: string;
    link?: string;
    icon: {
      src: string;
    };
  }[];
}

export const stackBlockDefaults: StackBlockConfig = {
  title: 'Stack',
  label: 'Some cool tools',
  items: [
    {
      title: 'Figma',
      label: 'Design',
      link: 'https://figma.com',
      icon: {
        src: 'https://cdn.lin.ky/default-data/figma.jpeg',
      },
    },
    {
      title: 'Amie',
      label: 'Productivity',
      link: 'https://amie.so',
      icon: {
        src: 'https://cdn.lin.ky/default-data/amie.jpg',
      },
    },
    {
      title: 'Warp',
      label: 'Engineering',
      link: 'https://warp.dev',
      icon: {
        src: 'https://cdn.lin.ky/default-data/warp.png',
      },
    },
  ],
};

export const StackSchema = Yup.object().shape({
  title: Yup.string().required('Please provide a title'),
  label: Yup.string().required('Please provide a label'),
  items: Yup.array()
    .min(1, 'Please add atleast one item')
    .of(
      Yup.object().shape({
        title: Yup.string().required('Please provide a title'),
        label: Yup.string().required('Please provide a label'),
        link: Yup.string().url('Please provide a valid URL'),
        icon: Yup.object().shape({
          src: Yup.string().required('Please provide an icon URL'),
        }),
      })
    ),
});
