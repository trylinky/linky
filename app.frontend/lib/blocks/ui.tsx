import { GitHubCommitsThisMonth } from './github-commits-this-month/ui-client';
import { Image } from './image/ui';
import { InstagramLatestPost } from './instagram-latest-post/ui-client';
import { LinkBar } from './link-bar/ui';
import { LinkBox } from './link-box/ui-client';
import { Map } from './map/ui';
import { SpotifyEmbed } from './spotify-embed/ui-client';
import { SpotifyPlayingNow } from './spotify-playing-now/ui-client';
import { WaitlistEmail } from './waitlist-email/ui';
import { Content } from '@/lib/blocks/content/ui';
import { Header } from '@/lib/blocks/header/ui-client';
import { InstagramFollowerCount } from '@/lib/blocks/instagram-follower-count/ui-client';
import { Reactions } from '@/lib/blocks/reaction/ui';
import { Stack } from '@/lib/blocks/stack/ui';
import { ThreadsFollowerCount } from '@/lib/blocks/threads-follower-count/ui-client';
import { TikTokFollowerCount } from '@/lib/blocks/tiktok-follower-count/ui-client';
import { TikTokLatestPost } from '@/lib/blocks/tiktok-latest-post/ui-client';
import { YouTube } from '@/lib/blocks/youtube/ui';
import { Blocks } from '@trylinky/blocks';

export interface BlockConfig {
  x: number;
  y: number;
  w: number;
  h: number;
  i: string;
}

export interface BlockProps {
  blockId: string;
  blockType: Blocks | 'default';
  isEditable: boolean;
  pageId: string;
}

export function renderBlock(block: any, pageId: string, isEditMode: boolean) {
  const sharedProps = {
    blockId: block.id,
    blockType: block.type,
    isEditable: isEditMode,
    pageId,
  };

  switch (block.type) {
    case 'header':
      return <Header {...sharedProps} {...block.data} />;
    case 'content':
      return <Content {...sharedProps} />;
    case 'stack':
      return <Stack {...sharedProps} />;
    case 'image':
      return (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image {...sharedProps} />
      );
    case 'instagram-latest-post':
      return (
        <InstagramLatestPost
          numberOfPosts={block.data.numberOfPosts}
          {...sharedProps}
        />
      );
    case 'instagram-follower-count':
      return <InstagramFollowerCount {...sharedProps} />;
    case 'github-commits-this-month':
      return (
        <GitHubCommitsThisMonth
          {...sharedProps}
          githubUsername={block.data.githubUsername}
        />
      );
    case 'spotify-playing-now':
      return <SpotifyPlayingNow {...sharedProps} />;
    case 'map':
      return <Map {...sharedProps} />;
    case 'link-box':
      return <LinkBox {...sharedProps} {...block.data} />;
    case 'link-bar':
      return <LinkBar {...sharedProps} />;
    case 'spotify-embed':
      return (
        <SpotifyEmbed
          {...sharedProps}
          spotifyAssetUrl={block.data.spotifyAssetUrl}
        />
      );
    case 'waitlist-email':
      return <WaitlistEmail {...sharedProps} />;
    case 'youtube':
      return <YouTube {...sharedProps} />;
    case 'threads-follower-count':
      return <ThreadsFollowerCount {...sharedProps} />;
    case 'tiktok-follower-count':
      return <TikTokFollowerCount {...sharedProps} />;
    case 'tiktok-latest-post':
      return <TikTokLatestPost {...sharedProps} />;
    case 'reactions':
      return <Reactions {...sharedProps} />;
  }
}
