import type { NicheContent } from '@/content/pseo-types';
import { isPublishableNiche } from '@/content/pseo-types';

const NICHES: NicheContent[] = [
  {
    slug: 'musicians',
    name: 'Musicians',
    h1: 'The best link in bio for musicians',
    answer:
      'Linky lets musicians show what they are currently playing on Spotify, link out to every streaming platform, and embed YouTube videos — all from a single, branded page that looks as good as their cover art.',
    targetKeyword: 'link in bio for musicians',
    recommendedBlocks: ['spotify-playing-now', 'link-box', 'youtube'],
    relatedIntegrations: ['spotify'],
    recommendedTemplate: 'midnight',
    sections: [
      {
        heading: 'Why musicians need a single link in bio',
        body: "Streaming is fragmented. Your audience is split across Spotify, Apple Music, YouTube, SoundCloud, Bandcamp, and wherever the next platform lands. When Instagram and TikTok only give you one URL, trying to cram every platform into your caption fails. A link-in-bio page collects all of those destinations in one place so fans can choose the platform they already use — instead of giving up and bouncing.",
      },
      {
        heading: 'Which Linky blocks suit musicians best',
        body: "The Spotify Now Playing block is the standout feature for music makers. It pulls your current or most recently played track from the Spotify API and keeps it live on your page — visitors see exactly what you are listening to or working on right now. Pair it with a YouTube block to embed a music video or live session directly in the page, and use Link Box blocks to send fans to your Spotify artist profile, Apple Music page, Bandcamp store, or merchandise shop. Every block updates automatically, so your page stays current without you having to touch it.",
      },
      {
        heading: 'A suggested page setup for musicians',
        body: "Start with a Header block at the top — artist name, a short bio, and your profile image. Below that, drop in the Spotify Now Playing block so the first thing fans see is what you are listening to. Add a YouTube block with your latest music video or lyric video underneath. Fill in three or four Link Box blocks pointing to Spotify, Apple Music, your merch store, and your tour dates page. That covers the core use cases: discovery, streaming, commerce, and live shows — all in one scroll.",
      },
      {
        heading: 'Themes and branding for artists',
        body: "Midnight is the default recommendation for musicians because the pure-black canvas makes album artwork and video thumbnails pop with maximum contrast. If your brand runs darker or more moody, it holds up well under any accent colour you set. Alternatively, Violet gives a deep purple backdrop that works well for artists in electronic, ambient, or lo-fi spaces. Whatever theme you pick, Linky lets you match the page palette to your current release artwork so the whole profile feels intentional.",
      },
      {
        heading: 'Getting started: from sign-up to live page in under five minutes',
        body: "Create a free Linky account at trylinky.com — no credit card required. In the editor, set your username (ideally your artist name), upload a profile photo, and write a one-line bio. Connect your Spotify account via the Integrations tab; Linky only requests read-only access to your listening activity. Add blocks in the order you want fans to see them, preview on mobile, and hit Publish. Your link-in-bio is live and ready to drop into every social profile.",
      },
    ],
    faqs: [
      {
        question: 'What does the Spotify Now Playing block actually show?',
        answer:
          'It displays the track you are currently playing on Spotify — title, artist, and album art — or your most recently played track when no session is active. It is not a discography widget; it shows listening activity only.',
      },
      {
        question: 'Can I link to multiple streaming platforms at once?',
        answer:
          'Yes. Use as many Link Box blocks as you need — one per platform. Each block has its own label and URL, so you can cover Spotify, Apple Music, Tidal, Bandcamp, and SoundCloud side by side.',
      },
      {
        question: 'Can I embed a music video directly on the page?',
        answer:
          'Yes. The YouTube block lets you paste any YouTube URL and embeds the video inline on your Linky page, so fans can watch without leaving.',
      },
      {
        question: 'Is Linky free for musicians?',
        answer:
          'Yes — the free plan gives you a fully functional link-in-bio page including the Spotify Now Playing block, Link Box blocks, and YouTube embeds. Paid plans unlock a custom domain and additional analytics.',
      },
      {
        question: 'Can I update my page when I release new music?',
        answer:
          'Absolutely. The editor is always available at trylinky.com/editor. Swap out Link Box URLs, update your bio, add a new YouTube embed, or rearrange blocks any time — changes publish instantly.',
      },
    ],
  },

  {
    slug: 'photographers',
    name: 'Photographers',
    h1: 'The best link in bio for photographers',
    answer:
      'Linky gives photographers a visual-first link page that puts their latest Instagram post front and centre, links to their portfolio and booking site, and matches the clean, high-contrast aesthetic that photography brands demand.',
    targetKeyword: 'link in bio for photographers',
    recommendedBlocks: ['image', 'link-box', 'instagram-latest-post'],
    relatedIntegrations: ['instagram'],
    recommendedTemplate: 'midnight',
    sections: [
      {
        heading: 'Why photographers need a strong link in bio',
        body: "Instagram is the primary portfolio for most photographers, but the single link in bio is where discovery turns into action. When a potential client or publication lands on your profile and wants to hire you, they need a fast path to your portfolio, your rates or booking page, and a way to contact you. A link-in-bio page that looks as polished as your feed gives that first impression the same care you put into every shot.",
      },
      {
        heading: 'Linky blocks built for visual storytelling',
        body: "The Instagram Latest Post block automatically pulls your most recent Instagram image and keeps it live on the page — so your Linky page and your Instagram feed are always in sync without any manual work. The Image block lets you pin a specific hero shot, print preview, or campaign image that you want every visitor to see regardless of when they land. Layer in Link Box blocks to route traffic to your portfolio site, your online print shop, your booking or inquiry form, and your editorial work. Together these blocks make the page do the heavy lifting so you can stay focused on shooting.",
      },
      {
        heading: 'A suggested page setup for photographers',
        body: "Lead with a Header block: your name, your specialty (wedding, portrait, commercial, etc.), and your location. Below that, place the Instagram Latest Post block so visitors immediately see your current work. Add an Image block pinned to a strong editorial piece or personal project if you want to highlight something that might not be your most recent post. Then stack three or four Link Box blocks: portfolio site, print shop, booking form, and Instagram handle. Keep the copy on each Link Box direct — 'Book a session', 'Buy prints', 'See my portfolio'.",
      },
      {
        heading: 'Choosing a visual theme for your photography brand',
        body: "Midnight — pure black — is the most common choice among photographers because it replicates the gallery-wall experience and makes any image genre look intentional: rich skin tones, vivid landscapes, or high-key editorial shots all benefit from a dark canvas. If your work leans towards fine art or film photography, Violet adds depth without competing with warm tones. Classic (off-white) suits lifestyle, wedding, or newborn photographers whose brand tends toward light and airy. Pick the theme that matches your existing brand identity, not just the one that looks good in the editor.",
      },
      {
        heading: 'Tips for photographers going live on Linky',
        body: "Use your real name or studio name as your username — it is the URL people will type or tap, so clarity matters more than being clever. Connect your Instagram Business or Creator account in the Integrations tab so the Latest Post block activates. Set up your Link Box blocks in priority order: whatever converts best for you (usually booking) goes first. On paid plans you can point a custom domain like links.yourstudio.com at your Linky page, which reinforces your brand every time you share the URL.",
      },
    ],
    faqs: [
      {
        question: 'Does the Instagram Latest Post block show my most recent photo automatically?',
        answer:
          'Yes. Once you connect your Instagram Business or Creator account, the block fetches your latest post and refreshes about once a minute, so it stays current as you post new work.',
      },
      {
        question: 'Can I pin a specific image that is not my latest Instagram post?',
        answer:
          'Yes. Use the Image block to upload or link any image you want to feature. It sits independently of your Instagram feed and displays whatever you choose.',
      },
      {
        question: 'Can I link to my portfolio website and booking form at the same time?',
        answer:
          'Yes. Add as many Link Box blocks as you need — each one has its own label and URL, so you can link out to your portfolio, booking form, print shop, and client galleries simultaneously.',
      },
      {
        question: 'Can I use a custom domain for my Linky page?',
        answer:
          'Custom domains are available on paid Linky plans. You can point any domain or subdomain you own at your Linky page, which makes the URL feel like a native part of your brand.',
      },
      {
        question: 'Does Linky work for both personal and studio photographer accounts?',
        answer:
          'Yes. Use your personal name as a solo photographer, or set your studio name as the username if you are running a team or agency. The editor has no restrictions on how you brand the page.',
      },
    ],
  },

  {
    slug: 'podcasters',
    name: 'Podcasters',
    h1: 'The best link in bio for podcasters',
    answer:
      'Linky gives podcasters one central page to route listeners to every podcast directory, embed episode videos from YouTube, and share show notes or newsletter sign-ups — so a single bio link covers the entire listener journey.',
    targetKeyword: 'link in bio for podcasters',
    recommendedBlocks: ['link-box', 'youtube', 'content'],
    relatedIntegrations: [],
    recommendedTemplate: 'violet',
    sections: [
      {
        heading: 'Why podcasters struggle with a single bio link',
        body: "Podcast directories are as fragmented as music streaming: Spotify, Apple Podcasts, Google Podcasts, Amazon Music, Overcast, Pocket Casts, and more. If you paste a Spotify episode link in your Instagram bio, you cut off every listener who uses Apple Podcasts. A link-in-bio page solves this by offering a platform-choice menu, so no listener gets left out. Beyond directories, podcasters also need somewhere to send people for episode transcripts, guest bios, show notes, merch, and their newsletter — none of which fit in a single URL.",
      },
      {
        heading: 'Linky blocks that work hardest for podcasters',
        body: "The Link Box block is the core tool: add one per directory so listeners can tap straight to their preferred app. The YouTube block is powerful if you record video versions of your episodes — embed the latest episode directly on the page so visitors can watch without leaving. The Content block (a freeform text or rich-text area) is ideal for episode show notes, a guest bio, or a short explainer of what the show is about. Combine those three and you have a listening hub, a video preview, and editorial context all in one scroll.",
      },
      {
        heading: 'A suggested page setup for podcasters',
        body: "Open with a Header block: show name, tagline, and your podcast artwork as the profile image. If you have a video episode, put a YouTube block next — it is the strongest visual hook and pre-qualifies listeners before they commit to an audio feed. Below that, stack Link Box blocks labelled by platform: 'Listen on Spotify', 'Listen on Apple Podcasts', 'Listen on Amazon Music'. Add a Content block for a short paragraph describing the show, the audience it is for, and your publishing schedule. Close with a Link Box pointing to your newsletter or community if you have one.",
      },
      {
        heading: 'Themes and branding for podcast shows',
        body: "Violet is a strong default for podcasters because the deep purple background reads as premium and slightly editorial — it suits interview shows, true crime, and business podcasts equally well. Midnight works for shows with a darker or more intense subject matter, and its pure-black canvas makes podcast artwork thumbnails stand out. If your show has a lighter, more conversational tone — comedy, lifestyle, or parenting — Classic or Lilac give a warmer, more accessible feel. Choose based on your show's tone, not just what looks nice in preview.",
      },
      {
        heading: 'Getting your podcast page live',
        body: "Sign up for a free Linky account and use your show name as the username. Upload your podcast cover art as the profile image — it is already the right square format. Add Link Box blocks for every directory where your show is listed; copy the direct show URL from each platform (not a single episode link) so the page stays evergreen as you release new episodes. Add a YouTube embed if you have a video feed. Write a Content block with two or three sentences about who the show is for and what they will learn or experience. Preview on mobile — most podcast listeners are on phones — then publish.",
      },
    ],
    faqs: [
      {
        question: 'Can I link to multiple podcast directories from one Linky page?',
        answer:
          'Yes. Add a Link Box block for each directory — Spotify, Apple Podcasts, Amazon Music, or any other platform. Each block has its own label and URL, so you can cover every listener regardless of their preferred app.',
      },
      {
        question: 'Can I embed a podcast episode video on my Linky page?',
        answer:
          'Yes. If you publish video versions of your episodes on YouTube, the YouTube block lets you embed any YouTube URL inline on the page so visitors can watch before deciding to subscribe.',
      },
      {
        question: 'Does Linky have a native podcast player or audio embed?',
        answer:
          'Linky does not currently include a native audio player block. The recommended approach is to link out to your preferred podcast directory with a Link Box block, or embed a YouTube video if you have a video version.',
      },
      {
        question: 'How do I keep my Linky page up to date as I release new episodes?',
        answer:
          'Link Box blocks pointing to your show-level URL (not an individual episode) stay evergreen automatically — listeners tap through and land on the latest episode in their app. If you embed YouTube videos, update the YouTube block URL when you want to feature a new episode.',
      },
      {
        question: 'Can I use Linky to grow my podcast newsletter?',
        answer:
          'Yes. Add a Waitlist Email block to collect email addresses directly on your Linky page, or use a Link Box block to send visitors to your existing newsletter sign-up page on Beehiiv, Substack, ConvertKit, or wherever you host it.',
      },
    ],
  },

  {
    slug: 'artists',
    name: 'Artists',
    h1: 'The best link in bio for artists',
    answer:
      'Linky gives visual artists a gallery-quality link page that showcases their work with image blocks and live Instagram posts, routes collectors to their shop or commission inquiry form, and carries the same aesthetic intentionality as the art itself.',
    targetKeyword: 'link in bio for artists',
    recommendedBlocks: ['image', 'link-box', 'instagram-latest-post'],
    relatedIntegrations: ['instagram'],
    recommendedTemplate: 'lilac',
    sections: [
      {
        heading: 'The link-in-bio problem for visual artists',
        body: "For visual artists — illustrators, painters, printmakers, sculptors, digital artists — Instagram is a portfolio engine, but a single link in bio forces a choice: portfolio site, Etsy shop, commission form, or the latest drop? Rotating the URL every time you have something new to promote trains followers to check back but not take action. A link-in-bio page removes that trade-off: every destination lives on the page at once, and you decide the order visitors see them.",
      },
      {
        heading: 'Linky blocks that serve visual artists',
        body: "The Image block is central for artists: upload a high-resolution piece, a preview of a print series, or a process shot that represents where your practice is right now. Unlike a social post, the Image block stays pinned until you change it — it is the piece you want every new visitor to see first. The Instagram Latest Post block keeps the page dynamically connected to your feed, so recent work surfaces automatically. Link Box blocks handle commerce and outreach: original work listings, print-on-demand shop, commission inquiry form, newsletter, and exhibition announcements each get their own block with a clear call to action.",
      },
      {
        heading: 'A suggested Linky page setup for artists',
        body: "Begin with a Header block: your name, a one-line description of your practice (medium and subject matter), and your best profile photo or self-portrait. Next, an Image block featuring a signature piece — the work you want to define your first impression. Follow with an Instagram Latest Post block so the page automatically reflects what you are posting. Then a row of Link Box blocks: 'Shop prints', 'Commission a piece', 'See full portfolio', and 'Follow on Instagram'. Optionally, add a Reactions block at the bottom — it is a low-friction way to gauge which work resonates without needing comments.",
      },
      {
        heading: 'Choosing a theme that matches your artistic identity',
        body: "Lilac is a natural fit for artists whose work leans toward illustration, flat design, or pastel palettes — the soft blue-purple background is assertive without overpowering colour-forward artwork. Violet suits artists working in darker, more saturated palettes: oil painting, dark fantasy illustration, or abstract expressionism. Midnight is ideal if your work includes photography or high-contrast linework. Classic (off-white) works for artists whose practice is delicate — watercolour, botanical illustration, fine-line work. Pick the theme that your existing audience already associates with you.",
      },
      {
        heading: 'Tips for getting your artist page right',
        body: "Use your working name or studio name as your Linky username — it is your URL and the first thing collectors and clients see. Set your profile image to a portrait or a detail from a current piece. Connect your Instagram account so the Latest Post block activates without any manual work. Write Link Box labels in plain, action-oriented language: 'Buy prints' converts better than 'Shop'. If you run commission slots on a schedule, add a Content block above your commission link explaining your current availability and turnaround time — it pre-qualifies leads before they click.",
      },
    ],
    faqs: [
      {
        question: 'Can I upload my own artwork images to Linky?',
        answer:
          'Yes. The Image block lets you upload any image to feature on your page. It is displayed prominently and stays pinned until you update it, making it ideal for a signature piece or current series.',
      },
      {
        question: 'Will my Linky page update automatically when I post on Instagram?',
        answer:
          'Yes, once you connect your Instagram Business or Creator account. The Instagram Latest Post block fetches your newest post and refreshes about once a minute, so your Linky page mirrors your feed automatically.',
      },
      {
        question: 'Can I sell art directly through Linky?',
        answer:
          'Linky does not process payments itself, but you can link directly to any storefront — Etsy, Shopify, Gumroad, Society6, or your own website — using Link Box blocks. Each block has its own label and destination URL.',
      },
      {
        question: 'How do I handle commissions through Linky?',
        answer:
          'Add a Link Box block pointing to your commission inquiry form (Typeform, Google Form, or your own site) and use the label to communicate availability, for example "Commissions open — book here". Update the label when your slots are full.',
      },
      {
        question: 'Can I show multiple pieces of work on one Linky page?',
        answer:
          'Yes. You can add multiple Image blocks to feature different works, and the Instagram Latest Post block dynamically surfaces your most recent post. Stack them vertically in whatever order you want visitors to encounter them.',
      },
    ],
  },

  {
    slug: 'content-creators',
    name: 'Content creators',
    h1: 'The best link in bio for content creators',
    answer:
      'Linky brings every platform a content creator lives on into one page — live Instagram posts, live TikTok stats, links to brand deals, affiliate programmes, and newsletters — so their audience always has somewhere to go after the swipe-up.',
    targetKeyword: 'link in bio for content creators',
    recommendedBlocks: ['instagram-latest-post', 'tiktok-latest-post', 'link-box'],
    relatedIntegrations: ['instagram', 'tiktok'],
    recommendedTemplate: 'orange-punch',
    sections: [
      {
        heading: 'Why content creators outgrow a single bio link',
        body: "Content creators post across Instagram, TikTok, YouTube Shorts, and Threads simultaneously, and every piece of content drives different audiences toward different things: a brand deal, an affiliate link, a course, a Patreon, or a new YouTube video. Swapping a single bio URL every time you publish is slow, error-prone, and trains your audience to stop clicking. A link-in-bio page solves the multi-platform problem by keeping every destination live at once, letting the audience self-route to whatever is most relevant to them right now.",
      },
      {
        heading: 'Linky blocks built for multi-platform creators',
        body: "Content creators benefit more from live social blocks than almost any other niche. The Instagram Latest Post block and the TikTok Latest Post block each pull your most recent content from their respective platforms and keep it current automatically — so your Linky page reflects what you posted today without any manual update. Link Box blocks handle the commerce layer: affiliate links, brand deal landing pages, course enrolment, Patreon, and merchandise each get their own block with clear copy. If you are building an email list, a Waitlist Email block captures addresses directly on the page without sending people away.",
      },
      {
        heading: 'A suggested page setup for content creators',
        body: "Open with a Header block: your creator name, a one-line description of your content niche, and a strong profile photo. Below that, stack an Instagram Latest Post block and a TikTok Latest Post block side by side to show live content from both platforms at once. Then add your monetisation layer: a Link Box for your most-promoted affiliate link, another for your current brand deal or course, and one for your YouTube channel. If you run a newsletter, a Waitlist Email block below that captures subscribers without leaving the page. Keep the total block count focused — five to eight blocks is usually enough; more than that and click rates drop.",
      },
      {
        heading: 'Themes and branding for creators',
        body: "Orange Punch is a strong choice for content creators whose personal brand is energetic, trend-forward, or lifestyle-focused — the warm orange primary colour reads as high-energy and modern. If your niche is tech, gaming, or finance, Midnight gives a clean, authoritative feel. Lilac works well for beauty, wellness, and fashion creators whose aesthetic is soft and aspirational. Whatever theme you pick, keep your profile photo and bio consistent with how you present on your primary platform — visitors should recognise you instantly when they tap the link in your bio.",
      },
      {
        heading: 'Getting your creator page live and keeping it updated',
        body: "Sign up free at trylinky.com and claim your creator name as the username. Connect Instagram and TikTok from the Integrations tab to activate the live post blocks. For affiliate and brand deal links, use Link Box blocks and update the URL whenever a campaign changes — changes publish instantly, no re-publishing required. On paid plans you get detailed click analytics per block, which tells you which links are actually converting so you can move high-performing content to the top of the page. Check your analytics weekly and reorder blocks based on what your audience is clicking.",
      },
    ],
    faqs: [
      {
        question: 'Can I show my latest Instagram and TikTok posts on the same page?',
        answer:
          'Yes. Connect both accounts from the Integrations tab and add an Instagram Latest Post block and a TikTok Latest Post block. Each refreshes about once a minute, so both stay current as you post on either platform.',
      },
      {
        question: 'How do I add affiliate links to my Linky page?',
        answer:
          'Use a Link Box block for each affiliate link. Set the label to something descriptive — the product name or "My favourite tool" — and paste the affiliate URL. You can add as many Link Box blocks as you need.',
      },
      {
        question: 'Can I collect email subscribers directly on my Linky page?',
        answer:
          'Yes. The Waitlist Email block captures email addresses directly on your Linky page. Collected addresses are available in your Linky dashboard, or you can link a Link Box to your existing newsletter sign-up page on Beehiiv, Substack, or ConvertKit.',
      },
      {
        question: 'Does Linky show TikTok follower counts?',
        answer:
          'Yes. In addition to showing your latest TikTok post, you can add a TikTok Follower Count block that displays your current follower count and refreshes automatically.',
      },
      {
        question: 'Can I track which links my audience clicks most?',
        answer:
          'Click analytics per block are available on paid Linky plans. The dashboard shows how many times each block was clicked so you can see which links perform best and reorder your page accordingly.',
      },
    ],
  },
];

export const niches = NICHES.filter(isPublishableNiche);
export const getNiche = (slug: string) => niches.find((n) => n.slug === slug) ?? null;
export const getNicheSlugs = () => niches.map((n) => n.slug);
