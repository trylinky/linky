/**
 * Canonical display name + one-line description per Linky block, used to render
 * block showcases on niche pages. Descriptions must be accurate to real block
 * behavior (e.g. Spotify = currently/recently playing, NOT 'latest release';
 * GitHub = rolling ~30-day commit count).
 */
export const BLOCK_PRESENTATION: Record<string, { name: string; description: string }> = {
  'link-box': { name: 'Link', description: 'A prominent, tappable button linking anywhere you choose.' },
  'link-bar': { name: 'Link bar', description: 'A compact row of small icon links to your profiles.' },
  image: { name: 'Image', description: 'Showcase a photo, cover art, logo, or product shot.' },
  content: { name: 'Text', description: 'A rich-text block for a bio, intro, or announcement.' },
  map: { name: 'Map', description: 'An embedded map pointing visitors to your location.' },
  youtube: { name: 'YouTube', description: 'Embed a YouTube video to play right on your page.' },
  'waitlist-email': { name: 'Email signup', description: 'Collect email addresses with a built-in signup form.' },
  reactions: { name: 'Reactions', description: 'Let visitors react to your page with a tap.' },
  header: { name: 'Header', description: 'Your avatar, name, and tagline at the top of the page.' },
  stack: { name: 'Stack', description: 'Group related blocks together in a tidy container.' },
  'spotify-playing-now': { name: 'Spotify Now Playing', description: 'Shows the track you are currently or most recently playing on Spotify.' },
  'instagram-latest-post': { name: 'Instagram latest post', description: 'Displays your most recent Instagram post, refreshed automatically.' },
  'instagram-follower-count': { name: 'Instagram followers', description: 'Shows your current Instagram follower count.' },
  'tiktok-latest-post': { name: 'TikTok latest post', description: 'Displays your most recent TikTok video.' },
  'tiktok-follower-count': { name: 'TikTok followers', description: 'Shows your current TikTok follower count.' },
  'threads-follower-count': { name: 'Threads followers', description: 'Shows your current Threads follower count.' },
  'github-commits-this-month': { name: 'GitHub commits', description: 'Shows your commit count over roughly the last 30 days from your GitHub username.' },
};

/** Presentation for a block key, with a humanized fallback for any unmapped key. */
export function getBlockPresentation(key: string): { name: string; description: string } {
  return BLOCK_PRESENTATION[key] ?? { name: humanizeKey(key), description: '' };
}

function humanizeKey(key: string): string {
  return key.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}
