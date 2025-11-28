import * as Yup from 'yup';

export interface InstagramLatestPostBlockConfig {
  numberOfPosts: number;
}

export interface InstagramIntegrationConfig {
  accessToken: string;
  instagramUserId: string;
  accountType?: 'BUSINESS' | 'CREATOR';
  username?: string;
}

export const instagramLatestPostBlockDefaults: InstagramLatestPostBlockConfig =
  {
    numberOfPosts: 1,
  };

export const InstagramLatestPostSchema = Yup.object().shape({
  numberOfPosts: Yup.number()
    .min(1)
    .max(10)
    .required('Please select a number of posts to display'),
});
