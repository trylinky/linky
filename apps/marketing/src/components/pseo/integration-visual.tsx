import {
  GithubCommitsThisMonthMockup,
  InstagramLatestPostMockup,
  SpotifyPlayingNowMockup,
} from '@/components/landing-page/ui-mockups';
import { ThemeMock, type ThemePalette } from '@/components/pseo/theme-mock';

const FALLBACK_PALETTE: ThemePalette = {
  colorBgBase: { h: 270, s: 0.6, l: 0.18 },
  colorBgPrimary: { h: 270, s: 0.5, l: 0.26 },
  colorBgSecondary: { h: 280, s: 0.5, l: 0.4 },
  colorBorderPrimary: { h: 270, s: 0.4, l: 0.32 },
  colorLabelPrimary: { h: 0, s: 0, l: 1 },
  colorLabelSecondary: { h: 280, s: 0.3, l: 0.85 },
  colorLabelTertiary: { h: 0, s: 0, l: 0.98 },
};

const DISPLAY_NAMES: Record<string, string> = {
  tiktok: 'TikTok',
  threads: 'Threads',
};

/**
 * Returns the best hero visual for an integration slug.
 * Known mockups: spotify, instagram, github.
 * Fallback: a colorful ThemeMock link-in-bio preview.
 */
export function IntegrationVisual({ slug }: { slug: string }) {
  switch (slug) {
    case 'spotify':
      return (
        <div className="w-full max-w-sm">
          <SpotifyPlayingNowMockup className="w-full" />
        </div>
      );
    case 'instagram':
      return (
        <div className="w-full max-w-sm h-64 rounded-2xl overflow-hidden shadow-sm">
          <InstagramLatestPostMockup className="w-full h-full" />
        </div>
      );
    case 'github':
      return (
        <div className="w-full max-w-sm">
          <GithubCommitsThisMonthMockup className="w-full" />
        </div>
      );
    default: {
      const name = DISPLAY_NAMES[slug] ?? 'Your link in bio';
      return (
        <div className="w-full max-w-sm">
          <ThemeMock palette={FALLBACK_PALETTE} name={name} />
        </div>
      );
    }
  }
}
