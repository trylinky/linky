import * as Yup from 'yup';

export interface ContentBlockConfig {
  title: string;
  content: string;
}

export const contentBlockDefaults: ContentBlockConfig = {
  title: 'About',
  content:
    "So I don't have no time, I don't even have a minute to waste… I feel like every second of my life, I've got to find a way to keep motivating people before it's too late.",
};

export const ContentSchema = Yup.object().shape({
  pageSlug: Yup.string(),
  content: Yup.string().required('Please provide some content'),
});
