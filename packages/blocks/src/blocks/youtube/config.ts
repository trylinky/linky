import * as Yup from 'yup';

export interface YouTubeBlockConfig {
  videoId: string;
}

export const youTubeBlockDefaults: YouTubeBlockConfig = {
  videoId: '',
};

export const YouTubeBlockSchema = Yup.object().shape({
  videoId: Yup.string().required('Please provide a video ID'),
});
