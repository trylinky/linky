import * as Yup from 'yup';

export interface SpotifyEmbedBlockConfig {
  spotifyAssetUrl: string;
}

export const spotifyEmbedBlockDefaults: SpotifyEmbedBlockConfig = {
  spotifyAssetUrl: 'https://open.spotify.com/track/5bIcHT2jjWqm9UVpIJwIId',
};

export const SpotifyEmbedSchema = Yup.object().shape({
  spotifyAssetUrl: Yup.string()
    .required('Please provide a title')
    .url('Please provide a valid URL'),
});
