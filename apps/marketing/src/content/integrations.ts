import type { IntegrationContent } from '@/content/pseo-types';
import { isPublishableIntegration } from '@/content/pseo-types';

const INTEGRATIONS: IntegrationContent[] = [
  {
    slug: 'spotify',
    integrationType: 'spotify',
    name: 'Spotify',
    h1: 'Add Spotify to your link in bio',
    answer:
      'Connect your Spotify account to Linky and a "Now Playing" block will display your current or most recently played track directly on your link-in-bio page, staying up to date as your listening activity changes.',
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
        body: 'The Spotify "Now Playing" block pulls your listening activity from the Spotify API and refreshes roughly every minute. When you have a song queued up, your visitors see the track title, artist, and album art. When your session is idle, the block falls back to whichever track you last played, so there is always something meaningful on screen.',
      },
      {
        heading: 'How to add Spotify to your Linky page',
        body: 'Start by creating a free Linky page at trylinky.com — it takes about 30 seconds. In the editor, click "Add block" and choose "Now Playing" from the Spotify section. You will be prompted to connect your Spotify account via OAuth; Linky only requests read access to your currently playing track and recently played history. Hit publish and your page is live.',
      },
      {
        heading: 'Why musicians and music lovers use it',
        body: 'Spotify is how most of your audience already discovers music, so embedding your listening activity removes a step between your content and their interest. Artists use it to signal what influences their work, DJs use it to tease upcoming sets, and music journalists use it to show what they are reviewing. It turns a static link page into something that stays current as your listening activity changes.',
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
          'Yes. The block updates automatically — the Spotify API response is refreshed roughly every minute, so visitors see your current or most recent track without any manual intervention.',
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
      'Connect your Instagram Business or Creator account to Linky to display your latest post and up-to-date follower count on your link-in-bio page.',
    targetKeyword: 'instagram link in bio',
    blockCopy: {
      'instagram-latest-post': {
        name: 'Latest Post',
        description:
          'Shows your most recent Instagram post — or a configurable number of recent posts — fetched from your connected account and refreshed about once a minute.',
      },
      'instagram-follower-count': {
        name: 'Follower Count',
        description:
          'Displays your current Instagram follower count, automatically refreshed about once a minute so the number stays accurate as your audience grows.',
      },
    },
    sections: [
      {
        heading: 'What your Instagram blocks show',
        body: 'Linky offers two Instagram blocks you can mix and match. The Latest Post block embeds your most recent Instagram post directly on your link page — you can show anywhere from one to ten recent posts depending on how much visual space you want to give your feed. The Follower Count block shows your up-to-date follower number, which is a strong social-proof signal for brands and creators negotiating sponsorship deals.',
      },
      {
        heading: 'How to connect Instagram to your Linky page',
        body: 'Because Instagram\'s API requires an official account type, you will need a Business or Creator account (not a personal account) to use these blocks. In the Linky editor, add a "Latest Post" or "Follower Count" block, then follow the OAuth flow to connect your Instagram account. The connection is read-only — Linky can read your posts and profile but cannot post, message, or modify your account. Once connected, both blocks refresh automatically about once a minute so your page stays current.',
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
        question: 'Does my follower count update automatically?',
        answer:
          'Yes. The Follower Count block refreshes your Instagram follower count approximately once a minute, so it stays accurate without any manual updates needed.',
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
      'Connect TikTok to Linky to show your latest TikTok post and your up-to-date follower count on your link-in-bio page, giving followers a taste of your content wherever they find your link.',
    targetKeyword: 'tiktok link in bio',
    blockCopy: {
      'tiktok-follower-count': {
        name: 'Follower Count',
        description:
          'Shows your current TikTok follower count, refreshed about once a minute so visitors see an accurate audience size.',
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
        body: 'In the Linky editor, add either the "Follower Count" or "Latest Post" block from the TikTok section, then complete the OAuth flow to authorise Linky with your TikTok account. Linky only requests read access to your public profile and videos. Once connected, both blocks update automatically about once a minute — no manual updates needed. You can use one or both blocks on the same page.',
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
        question: 'How do I connect my TikTok account?',
        answer:
          'In the Linky editor, add a TikTok block and you will be guided through an OAuth authorisation flow. Linky only requests read access to your profile and videos — no posting or account management permissions are requested.',
      },
      {
        question: 'Does my follower count update automatically?',
        answer:
          'Yes. The Follower Count block refreshes your TikTok follower count approximately once a minute, so it stays accurate without any manual updates.',
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
      'Connect your Threads account to Linky to display your up-to-date follower count on your link-in-bio page, giving visitors an accurate measure of your Threads audience.',
    targetKeyword: 'threads link in bio',
    blockCopy: {
      'threads-follower-count': {
        name: 'Follower Count',
        description:
          'Displays your current Threads follower count, automatically refreshed about once a minute so visitors see an accurate audience size.',
      },
    },
    sections: [
      {
        heading: 'What your Threads block shows',
        body: 'Linky\'s Threads integration currently offers a Follower Count block that pulls your audience size from the Threads API, refreshing about once a minute. As Threads continues to grow and expand its developer platform, this is a straightforward way to signal your presence on the platform to visitors who may not yet know you are there.',
      },
      {
        heading: 'How to add your Threads follower count to Linky',
        body: 'In the Linky editor, add the "Follower Count" block from the Threads section. You will be walked through an OAuth authorisation flow where you grant Linky read-only access to your Threads profile. Once connected, your follower count appears on your page and updates automatically about once a minute — no manual updates required.',
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
          'Yes. The block refreshes your follower count from the Threads API approximately once a minute, so it stays accurate without any manual updates needed.',
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
      'Add the GitHub Commits block to your Linky page to display your recent GitHub commit activity over roughly the past 30 days — a live proof-of-work signal that requires only your GitHub username.',
    targetKeyword: 'github link in bio',
    blockCopy: {
      'github-commits-this-month': {
        name: 'Commits This Month',
        description:
          'Shows the total number of commits you have made in roughly the past 30 days, reflecting your recent GitHub activity with no OAuth connection required.',
      },
    },
    sections: [
      {
        heading: 'What your GitHub block shows',
        body: 'The GitHub Commits block counts your recent commit contributions over a rolling window of roughly the past 30 days and displays that number on your Linky page. It is a live activity signal — visitors see a number that reflects your recent shipping cadence rather than a static badge. Only your GitHub username is needed; no OAuth connection or personal access token is required from you.',
      },
      {
        heading: 'How to add GitHub commits to your Linky page',
        body: 'In the Linky editor, add the "Commits This Month" block from the GitHub section. You will be prompted to enter your GitHub username — that is all the configuration required. Because the block uses a server-side GitHub API connection, no OAuth authorisation or personal token is needed from you. Hit publish and your commit count will be live on your page within seconds.',
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
          'No OAuth authorisation or personal access token is required from you. You only provide your GitHub username, and the block uses a server-side API connection to fetch your recent commit activity.',
      },
      {
        question: 'Does the commit count update automatically?',
        answer:
          'Yes. The block fetches your recent GitHub commit activity automatically, so the number on your page reflects your activity over roughly the past 30 days without any manual refreshing.',
      },
      {
        question: 'What time period does the commit count cover?',
        answer:
          'The block counts your commit contributions over a rolling window of approximately the past 30 days from the current date. It is not tied to a calendar month and does not reset on the 1st of the month.',
      },
      {
        question: 'What counts as a commit in the block?',
        answer:
          'The block counts your commit contributions as reported by the GitHub API for the rolling ~30-day window. Only your GitHub username is needed to display this activity — no additional setup is required.',
      },
    ],
  },
];

export const integrations = INTEGRATIONS.filter(isPublishableIntegration);
export const getIntegration = (slug: string) => integrations.find((i) => i.slug === slug) ?? null;
export const getIntegrationSlugs = () => integrations.map((i) => i.slug);
