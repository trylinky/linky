import { ContentSchema, contentBlockDefaults } from './content/config';
import {
  GithubCommitsThisMonthSchema,
  githubCommitsThisMonthBlockDefaults,
} from './github-commits-this-month/config';
import { HeaderSchema, headerBlockDefaults } from './header/config';
import { ImageSchema, imageBlockDefaults } from './image/config';
import { instagramFollowerCountBlockDefaults } from './instagram-follower-count/config';
import {
  InstagramLatestPostSchema,
  instagramLatestPostBlockDefaults,
} from './instagram-latest-post/config';
import { LinkBarSchema, linkBarBlockDefaults } from './link-bar/config';
import { LinkBoxSchema, linkBoxBlockDefaults } from './link-box/config';
import { MapSchema, mapBlockDefaults } from './map/config';
import { reactionBlockDefaults } from './reaction/config';
import {
  SpotifyEmbedSchema,
  spotifyEmbedBlockDefaults,
} from './spotify-embed/config';
import { spotifyIntegrationDefaults } from './spotify-playing-now/config';
import { StackSchema, stackBlockDefaults } from './stack/config';
import { threadsFollowerCountBlockDefaults } from './threads-follower-count/config';
import { tiktokFollowerCountBlockDefaults } from './tiktok-follower-count/config';
import { tiktokLatestPostBlockDefaults } from './tiktok-latest-post/config';
import { Blocks } from './types';
import {
  WaitlistEmailBlockSchema,
  waitlistEmailBlockDefaults,
} from './waitlist-email/config';
import { YouTubeBlockSchema, youTubeBlockDefaults } from './youtube/config';
import * as Yup from 'yup';

export const blocks: Record<
  Blocks,
  {
    schema: Yup.Schema | null;
    defaults: any;
    isBeta?: boolean;
    integrationType?: string;
  }
> = {
  'link-box': {
    schema: LinkBoxSchema,
    defaults: linkBoxBlockDefaults,
  },
  stack: {
    defaults: stackBlockDefaults,
    schema: StackSchema,
  },
  content: {
    defaults: contentBlockDefaults,
    schema: ContentSchema,
  },
  header: {
    defaults: headerBlockDefaults,
    schema: HeaderSchema,
  },
  image: {
    defaults: imageBlockDefaults,
    schema: ImageSchema,
  },
  'github-commits-this-month': {
    defaults: githubCommitsThisMonthBlockDefaults,
    schema: GithubCommitsThisMonthSchema,
  },
  'spotify-playing-now': {
    defaults: spotifyIntegrationDefaults,
    schema: null,
    integrationType: 'spotify',
  },
  'instagram-latest-post': {
    defaults: instagramLatestPostBlockDefaults,
    schema: InstagramLatestPostSchema,
    integrationType: 'instagram',
  },
  'instagram-follower-count': {
    defaults: instagramFollowerCountBlockDefaults,
    schema: null,
    integrationType: 'instagram',
  },
  map: {
    defaults: mapBlockDefaults,
    schema: MapSchema,
  },
  'link-bar': {
    defaults: linkBarBlockDefaults,
    schema: LinkBarSchema,
  },
  'spotify-embed': {
    defaults: spotifyEmbedBlockDefaults,
    schema: SpotifyEmbedSchema,
  },
  'waitlist-email': {
    defaults: waitlistEmailBlockDefaults,
    schema: WaitlistEmailBlockSchema,
  },
  youtube: {
    defaults: youTubeBlockDefaults,
    schema: YouTubeBlockSchema,
  },
  'threads-follower-count': {
    defaults: threadsFollowerCountBlockDefaults,
    schema: null,
    integrationType: 'threads',
  },
  'tiktok-follower-count': {
    defaults: tiktokFollowerCountBlockDefaults,
    schema: null,
    integrationType: 'tiktok',
  },
  'tiktok-latest-post': {
    defaults: tiktokLatestPostBlockDefaults,
    schema: null,
    integrationType: 'tiktok',
  },
  reactions: {
    defaults: reactionBlockDefaults,
    schema: null,
  },
};
