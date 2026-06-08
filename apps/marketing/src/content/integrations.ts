import type { IntegrationContent } from '@/content/pseo-types';
import { isPublishableIntegration } from '@/content/pseo-types';

const INTEGRATIONS: IntegrationContent[] = [
  {
    slug: 'spotify',
    integrationType: 'spotify',
    name: 'Spotify',
    h1: 'Add Spotify to your link in bio',
    answer:
      'Connect your Spotify account to Linky and a live "Now Playing" block will display your current or most recently played track directly on your link-in-bio page.',
    targetKeyword: 'spotify link in bio',
    blockCopy: {
      'spotify-playing-now': {
        name: 'Now Playing',
        description:
          'Displays the track you are currently playing on Spotify, or the last track you played if nothing is active right now.',
      },
    },
    sections: [
      {
        heading: 'What your Spotify block shows',
        body: 'The Spotify "Now Playing" block pulls your real-time listening activity directly from the Spotify API. When you have a song queued up, your visitors see the track title, artist, and album art. When your session is idle, the block falls back to whichever track you last played, so there is always something meaningful on screen.',
      },
      {
        heading: 'How to add Spotify to your Linky page',
        body: 'Start by creating a free Linky page at trylinky.com — it takes about 30 seconds. In the editor, click "Add block" and choose "Now Playing" from the Spotify section. You will be prompted to connect your Spotify account via OAuth; Linky only requests read access to your currently playing track and recently played history. Hit publish and your page is live.',
      },
      {
        heading: 'Why musicians and music lovers use it',
        body: 'Spotify is how most of your audience already discovers music, so embedding your listening activity removes a step between your content and their interest. Artists use it to signal what influences their work, DJs use it to tease upcoming sets, and music journalists use it to show what they are reviewing. It turns a static link page into something that updates itself every time you hit play.',
      },
      {
        heading: 'Pair it with the rest of your page',
        body: 'The Now Playing block looks especially good next to a Link Box pointing to your Spotify artist profile or latest release. Layer in a Header block with your artist bio and you have a complete landing page for anyone who lands on your link in bio. You can also match the page palette to your album artwork colours for a fully branded feel.',
      },
    ],
    faqs: [
      {
        question: 'Does the Now Playing block update automatically?',
        answer:
          'Yes. The block fetches your current playback state from the Spotify API each time a visitor loads your page, so it reflects whatever you are playing at that moment with no manual refreshing required.',
      },
      {
        question: 'What happens when I am not listening to anything?',
        answer:
          'When no track is active, the block displays the most recently played track from your Spotify history, so your page never appears empty.',
      },
      {
        question: 'Does Linky need access to my full Spotify account?',
        answer:
          'No. The OAuth connection only requests the minimum scopes needed to read your currently playing track and recently played tracks. Linky cannot see your playlists, saved songs, or payment details.',
      },
      {
        question: 'Is this free to use?',
        answer:
          'The Spotify Now Playing block is available on all Linky plans, including the free tier. No paid Linky subscription is required to connect your Spotify account.',
      },
    ],
  },

  {
    slug: 'instagram',
    integrationType: 'instagram',
    name: 'Instagram',
    h1: 'Add Instagram to your link in bio',
    answer:
      'Connect your Instagram Business or Creator account to Linky to display your latest post and live follower count on your link-in-bio page.',
    targetKeyword: 'instagram link in bio',
    blockCopy: {
      'instagram-latest-post': {
        name: 'Latest Post',
        description:
          'Shows your most recent Instagram post — or a configurable number of recent posts — pulled live from your connected account.',
      },
      'instagram-follower-count': {
        name: 'Follower Count',
        description:
          'Displays your current Instagram follower count, refreshed automatically so the number stays accurate as your audience grows.',
      },
    },
    sections: [
      {
        heading: 'What your Instagram blocks show',
        body: 'Linky offers two Instagram blocks you can mix and match. The Latest Post block embeds your most recent Instagram post directly on your link page — you can show anywhere from one to ten recent posts depending on how much visual space you want to give your feed. The Follower Count block shows your real-time follower number, which is a strong social-proof signal for brands and creators negotiating sponsorship deals.',
      },
      {
        heading: 'How to connect Instagram to your Linky page',
        body: 'Because Instagram\'s API requires an official account type, you will need a Business or Creator account (not a personal account) to use these blocks. In the Linky editor, add a "Latest Post" or "Follower Count" block, then follow the OAuth flow to connect your Instagram account. The connection is read-only — Linky can read your posts and profile but cannot post, message, or modify your account. Once connected, both blocks update automatically every time someone visits your page.',
      },
      {
        heading: 'Why Instagram integration matters for creators',
        body: 'Instagram is typically where creators have the most visual content, yet the platform only allows one external link. Bringing your Instagram feed to your link page lets you showcase that visual work to anyone who finds you from a podcast, YouTube channel, or email list — audiences who may not follow you on Instagram yet. Displaying your follower count alongside your content adds the credibility signal that helps convert casual visitors into followers.',
      },
      {
        heading: 'Combine with other blocks for a complete landing page',
        body: 'Pair the Latest Post block with a Link Box that sends visitors to your full Instagram profile for maximum conversion. If you sell products, add a Link Bar beneath the posts to route people to your shop. The Follower Count block works well in a Header or alongside a testimonial-style content block to establish credibility before visitors click any links.',
      },
    ],
    faqs: [
      {
        question: 'Do I need a Business or Creator Instagram account?',
        answer:
          'Yes. Instagram\'s API only provides access to posts and follower data for Business and Creator accounts. Personal accounts are not supported by the API, so you will need to switch your account type in the Instagram app before connecting.',
      },
      {
        question: 'How many posts can the Latest Post block show?',
        answer:
          'You can configure the block to display between 1 and 10 of your most recent posts. Single-post mode works well as a featured piece of content; multi-post mode gives visitors a scrollable grid preview of your feed.',
      },
      {
        question: 'Does my follower count update in real time?',
        answer:
          'The Follower Count block fetches your current count each time a visitor loads your page, so it reflects your actual follower number at the time of the visit rather than a stale cached figure.',
      },
      {
        question: 'Can Linky post to my Instagram on my behalf?',
        answer:
          'No. The connection is strictly read-only. Linky can display your existing posts and follower count but has no ability to create posts, send messages, or modify anything on your Instagram account.',
      },
    ],
  },

  {
    slug: 'tiktok',
    integrationType: 'tiktok',
    name: 'TikTok',
    h1: 'Add TikTok to your link in bio',
    answer:
      'Connect TikTok to Linky to show your latest TikTok post and your live follower count on your link-in-bio page, giving followers a taste of your content wherever they find your link.',
    targetKeyword: 'tiktok link in bio',
    blockCopy: {
      'tiktok-follower-count': {
        name: 'Follower Count',
        description:
          'Shows your current TikTok follower count, updated automatically so new visitors always see your real audience size.',
      },
      'tiktok-latest-post': {
        name: 'Latest Post',
        description:
          'Displays your most recently published TikTok video, giving visitors a preview of your content before they decide to follow.',
      },
    },
    sections: [
      {
        heading: 'What your TikTok blocks show',
        body: 'Linky\'s TikTok integration offers two blocks. The Follower Count block surfaces your real audience size — a key credibility metric when you are pitching brand deals or driving sign-ups from other channels. The Latest Post block previews your most recent TikTok, putting your content front and centre for anyone who finds your link in bio from a bio link, QR code, or email signature.',
      },
      {
        heading: 'How to add TikTok to your Linky page',
        body: 'In the Linky editor, add either the "Follower Count" or "Latest Post" block from the TikTok section, then complete the OAuth flow to authorise Linky with your TikTok account. Linky only requests read access to your public profile and videos. Once connected, both blocks pull fresh data on each page load — no manual updates needed. You can use one or both blocks on the same page.',
      },
      {
        heading: 'Why TikTok creators rely on a strong link page',
        body: 'TikTok\'s algorithm regularly pushes content to new audiences who have never seen your profile before. When a viral moment drives a spike in profile visits, your link in bio is the only place those curious viewers can go deeper. A page that immediately shows your follower count and latest video gives that traffic a compelling reason to follow and explore — turning viral views into lasting growth on other platforms.',
      },
      {
        heading: 'Round out your page with links and other content',
        body: 'Most TikTok creators pair their follower count with Link Box blocks pointing to their merch store, YouTube channel, or newsletter signup. Adding the Latest Post block above a row of destination links creates a natural journey: visitors see your content, build trust, and then convert. Choose a bold, high-contrast palette to match the energetic aesthetic TikTok audiences expect.',
      },
    ],
    faqs: [
      {
        question: 'Does Linky work with personal TikTok accounts?',
        answer:
          'Yes. Unlike Instagram, TikTok\'s API supports both personal and professional account types for reading public profile data and latest videos, so you can connect any TikTok account.',
      },
      {
        question: 'Does my follower count update automatically?',
        answer:
          'Yes. The Follower Count block fetches your current count from TikTok\'s API each time a visitor loads your Linky page, so it always reflects your real audience size.',
      },
      {
        question: 'Which video does the Latest Post block show?',
        answer:
          'The block displays the most recently published public video on your TikTok profile. Private or deleted videos will not appear.',
      },
      {
        question: 'Can I show both my follower count and latest post at the same time?',
        answer:
          'Absolutely. You can add both TikTok blocks to the same page and arrange them however you like in the Linky editor. Many creators place the Latest Post block near the top and the Follower Count in a more subtle position below their main links.',
      },
    ],
  },

  {
    slug: 'threads',
    integrationType: 'threads',
    name: 'Threads',
    h1: 'Add Threads to your link in bio',
    answer:
      'Connect your Threads account to Linky to display your live follower count on your link-in-bio page, giving visitors an instant measure of your Threads audience.',
    targetKeyword: 'threads link in bio',
    blockCopy: {
      'threads-follower-count': {
        name: 'Follower Count',
        description:
          'Displays your current Threads follower count, updated on each page visit so visitors always see your actual audience size.',
      },
    },
    sections: [
      {
        heading: 'What your Threads block shows',
        body: 'Linky\'s Threads integration currently offers a Follower Count block that pulls your real-time audience size from the Threads API. As Threads continues to grow and expand its developer platform, this is a straightforward way to signal your presence on the platform to visitors who may not yet know you are there.',
      },
      {
        heading: 'How to add your Threads follower count to Linky',
        body: 'In the Linky editor, add the "Follower Count" block from the Threads section. You will be walked through an OAuth authorisation flow where you grant Linky read-only access to your Threads profile. Once connected, your follower count appears on your page and refreshes automatically with each visit — no manual updates required.',
      },
      {
        heading: 'Why showing your Threads audience matters',
        body: 'Threads is where many creators and journalists are building an audience distinct from Instagram or Twitter. If you have cultivated a following there, surfacing that number on your link page is an easy way to cross-promote the community and encourage visitors from other channels to find and follow you. Social proof numbers, even on newer platforms, consistently improve click-through to profile links.',
      },
      {
        heading: 'Combine with a link to your Threads profile',
        body: 'The Follower Count block works best alongside a Link Box that sends visitors directly to your Threads profile. Place the count next to a short call to action — "Join the conversation on Threads" — and you have a compact, high-converting placement. You can also combine it with your Instagram blocks if you want to show your broader Meta ecosystem reach in one place.',
      },
    ],
    faqs: [
      {
        question: 'Does the Threads follower count update automatically?',
        answer:
          'Yes. The block fetches your current follower count from the Threads API on every page load, so the number reflects your real audience size at the time of each visit.',
      },
      {
        question: 'Can Linky post to Threads on my behalf?',
        answer:
          'No. The Threads integration is strictly read-only. Linky reads your public follower count but has no ability to create posts or take any action on your Threads account.',
      },
      {
        question: 'Do I need a separate Threads account, or is it linked to Instagram?',
        answer:
          'Threads accounts are tied to an Instagram account at creation, but you authorise Linky separately via the Threads OAuth flow. You do not need to connect your Instagram account first — the two integrations in Linky are independent.',
      },
      {
        question: 'Is the Threads integration free?',
        answer:
          'Yes. The Threads Follower Count block is available on all Linky plans, including the free tier.',
      },
    ],
  },

  {
    slug: 'github',
    integrationType: 'github',
    name: 'GitHub',
    h1: 'Add GitHub to your link in bio',
    answer:
      'Add the GitHub Commits This Month block to your Linky page to display how many commits you have made to public GitHub repositories in the current calendar month.',
    targetKeyword: 'github link in bio',
    blockCopy: {
      'github-commits-this-month': {
        name: 'Commits This Month',
        description:
          'Shows the total number of commits you have pushed to public GitHub repositories in the current calendar month, updated on every page load.',
      },
    },
    sections: [
      {
        heading: 'What your GitHub block shows',
        body: 'The GitHub Commits This Month block counts the public commits you have made across all repositories in the current calendar month and displays that number on your Linky page. It is a live activity signal — visitors see a number that reflects your recent shipping cadence rather than a static badge. The count resets at the start of each new month and requires only your GitHub username, no authentication needed.',
      },
      {
        heading: 'How to add GitHub commits to your Linky page',
        body: 'In the Linky editor, add the "Commits This Month" block from the GitHub section. You will be prompted to enter your GitHub username — that is all the configuration required. Because the block reads public commit data from GitHub\'s API, no OAuth connection or token is needed. Hit publish and your commit count will be live on your page within seconds.',
      },
      {
        heading: 'Why developers use it on their personal page',
        body: 'Developers, open-source maintainers, and engineering job seekers use the commits block as a concise proof-of-work signal. Rather than linking to a GitHub profile and hoping visitors dig through repositories, the block surfaces the headline metric — how active you are right now — right on your link page. It is particularly useful on a personal site or portfolio landing page where you want to communicate that you are actively building.',
      },
      {
        heading: 'Pair it with links to your best work',
        body: 'The commits block pairs naturally with Link Box blocks pointing to your key repositories, portfolio, or personal website. Add a Stack block grouping your open-source projects or a Content block with a short bio, and you have a developer-focused link page that says more about your work than any resume summary line. Choose a minimal, dark palette to reinforce the technical aesthetic.',
      },
    ],
    faqs: [
      {
        question: 'Does Linky need access to my private GitHub repositories?',
        answer:
          'No. The GitHub Commits This Month block only reads public commit data using your GitHub username. No OAuth authorisation or personal access token is required, and private repositories are never included in the count.',
      },
      {
        question: 'Does the commit count update automatically?',
        answer:
          'Yes. The block fetches your current month\'s commit count from GitHub\'s public API each time a visitor loads your page, so the number always reflects your activity up to that moment.',
      },
      {
        question: 'When does the monthly count reset?',
        answer:
          'The count covers commits made in the current calendar month. On the first day of a new month, the count resets to zero and begins accumulating again from that point.',
      },
      {
        question: 'Are commits to private repositories counted?',
        answer:
          'No. The block uses GitHub\'s public API with only a username, which means it can only access public repository data. Commits to private repositories are not counted or visible.',
      },
    ],
  },
];

export const integrations = INTEGRATIONS.filter(isPublishableIntegration);
export const getIntegration = (slug: string) => integrations.find((i) => i.slug === slug) ?? null;
export const getIntegrationSlugs = () => integrations.map((i) => i.slug);
