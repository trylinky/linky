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

  // ── LOCAL SET ────────────────────────────────────────────────────────────────

  {
    slug: 'restaurants',
    name: 'Restaurants',
    h1: 'The best link in bio for restaurants',
    answer:
      'Linky gives restaurants a single link page that shows their location on a map, links to their menu and reservation system, and highlights signature dishes with images — so hungry guests can act the moment they find you on social.',
    targetKeyword: 'link in bio for restaurants',
    recommendedBlocks: ['map', 'link-box', 'image'],
    relatedIntegrations: [],
    recommendedTemplate: 'orange-punch',
    sections: [
      {
        heading: 'Why restaurants need more than one link in their bio',
        body: "A restaurant's social media presence does a lot of jobs at once: it tells the story of the food, builds anticipation for specials, and handles practical questions like hours, location, and reservations. Trying to route all of that through a single URL means you are always compromising — send people to the menu and the booking link disappears; send people to OpenTable and new visitors can not find your address. A link-in-bio page solves this by keeping every destination live simultaneously so guests can find what they need without friction.",
      },
      {
        heading: 'Linky blocks that work hardest for restaurants',
        body: "The Map block is the standout choice for restaurants: it embeds a live map pinned to your address so guests can tap straight into their navigation app without ever copying an address or Googling your name. Pair it with an Image block to pin a hero shot of your best dish or your dining room — the visual hook that makes a hungry scroll stop. Link Box blocks handle the functional layer: one for your online menu, one for your reservation platform (OpenTable, Resy, or direct booking), and one for your delivery app profile. If you run a loyalty programme or email list, a Waitlist Email block captures sign-ups without sending guests away from the page.",
      },
      {
        heading: 'A suggested page setup for restaurants',
        body: "Start with a Header block: restaurant name, a short one-liner about the cuisine or vibe ('Modern Italian in the heart of Shoreditch'), and a strong profile image or logo. Below that, place an Image block featuring a dish that best represents your menu — ideally your most photogenic item or current seasonal special. Follow with a Map block so location and directions are immediately accessible. Then stack Link Box blocks: 'View menu', 'Reserve a table', 'Order delivery', and optionally 'See our events'. Keep the block order aligned with the most common intent: most visitors will want the menu before they book.",
      },
      {
        heading: 'Keeping your restaurant page current across seasons and specials',
        body: "Restaurants change constantly — seasonal menus, tasting nights, holiday closures, new delivery partnerships. Because Linky publishes changes instantly, you can update your Image block when a new dish launches, swap a Link Box URL when you add a new delivery platform, or temporarily add a Link Box for a ticketed event without touching the rest of the page. No waiting for a developer to update your website. For recurring specials, update the Image block on the day and add a brief note in the Header bio — that is enough to make the page feel timely even without a full refresh.",
      },
      {
        heading: 'Choosing a theme that reflects your restaurant brand',
        body: "Orange Punch works well for casual, high-energy dining concepts — street food, brunch spots, pizza by the slice — where the brand is warm, approachable, and lively. Forest suits farm-to-table and sustainability-focused restaurants whose visual identity runs to earthy greens and natural textures. Classic (off-white) is a strong choice for fine dining establishments where restraint signals quality. Midnight works for cocktail bars, omakase counters, and late-night venues where the atmosphere is part of the experience. Pick the palette that guests would recognise as yours before they even read the name.",
      },
    ],
    faqs: [
      {
        question: 'Can I show my restaurant address and directions on my Linky page?',
        answer:
          'Yes. The Map block embeds a live map pinned to any address you specify. Guests can tap the map to open their navigation app of choice directly, without needing to copy or search for the address.',
      },
      {
        question: 'Does Linky support online reservations or table booking?',
        answer:
          'Linky does not have a built-in booking system, but you can link directly to your reservation platform — OpenTable, Resy, SevenRooms, or your own website — using a Link Box block. Set the label to "Reserve a table" and paste in your booking URL.',
      },
      {
        question: 'Can I show my menu on my Linky page?',
        answer:
          'You can link to your menu with a Link Box block pointing to a PDF, your website menu page, or a third-party platform like Flipdish or Square. If you want to display the menu directly on the page, a Content block can hold formatted text, though it is best suited to shorter menus.',
      },
      {
        question: 'Can I link to multiple food delivery apps from the same page?',
        answer:
          'Yes. Add a Link Box block for each delivery platform — Deliveroo, Uber Eats, Just Eat, or any other. Each block has its own label and URL so guests can choose their preferred app.',
      },
      {
        question: 'How do I update my page when the menu or hours change?',
        answer:
          'Log in to trylinky.com/editor, make your changes — update the Image block, swap a Link Box URL, or edit the Header bio — and publish. Changes go live instantly with no developer or waiting period.',
      },
    ],
  },

  {
    slug: 'salons',
    name: 'Salons',
    h1: 'The best link in bio for salons',
    answer:
      'Linky gives hair and beauty salons a polished link page that showcases their work with images, links to their booking system and price list, and lets clients find the salon location instantly — all from a single tap in the bio.',
    targetKeyword: 'link in bio for salons',
    recommendedBlocks: ['link-box', 'image', 'map'],
    relatedIntegrations: [],
    recommendedTemplate: 'lilac',
    sections: [
      {
        heading: 'Why a link-in-bio page matters for salons',
        body: "For salons, Instagram and TikTok are both a portfolio and a booking engine — clients scroll before-and-afters, fall in love with a colour technique, and then need a fast path to booking that stylist. If the only link in your bio goes to your homepage, you lose clients at every step: they have to find the services page, find the booking button, and recognise their stylist's name. A focused link-in-bio page cuts that journey down to two taps: see the work, book the appointment.",
      },
      {
        heading: 'Linky blocks best suited to hair and beauty salons',
        body: "The Image block is essential for salons: pin a portfolio image that represents the quality and style of work you do — a balayage finish, a bridal updo, a nail art set, or a before-and-after. It stays front and centre until you choose to update it, so it is always doing its job of converting interest into bookings. A Map block makes it easy for new clients to find you — they tap through directly to navigation without needing to type an address. Link Box blocks handle the commercial flow: your booking platform link ('Book an appointment'), a price list PDF or page, and your Instagram or TikTok profile for clients who want to see more of your work before committing.",
      },
      {
        heading: 'A suggested page setup for salons',
        body: "Open with a Header block: salon name, a short descriptor of your speciality ('Colour specialists in East London'), and a profile image — either your logo or a strong portfolio shot. Below that, add an Image block with your best current portfolio piece. Then a Link Box labelled 'Book an appointment' pointing to your booking platform (Fresha, Treatwell, Booksy, Square, or wherever you take bookings). Follow with a Map block so location is always visible. Add a second Link Box for your price list. If individual stylists have their own booking links, add a Link Box per stylist or use a single link that goes to a booking page where clients can choose their preferred person.",
      },
      {
        heading: 'Showcasing your work without rebuilding the page every week',
        body: "The best salon Linky pages stay fresh without constant updates. Use the Image block for a single hero image — a piece of work you are proud to have as your first impression — and update it when you complete a particularly noteworthy colour job or cut. For ongoing fresh content, connect your Instagram account and add an Instagram Latest Post block: it automatically surfaces your most recent post, so clients always see something new without you needing to log in to Linky every day. The combination of a pinned hero image and a live feed block covers both permanence and freshness.",
      },
      {
        heading: 'Choosing a theme for your salon brand',
        body: "Lilac is a natural fit for many salons — its soft, refined palette conveys professionalism with a feminine edge that suits colour studios, nail bars, and beauty salons. Classic (off-white) works for salons with a minimal, Scandi-inspired aesthetic. Violet is a stronger choice for edgier studios that specialise in fashion colour or avant-garde cuts. Orange Punch can suit busy, high-energy barbershops or urban nail studios where the brand is bold and approachable. Choose the theme that a client would recognise as consistent with your interior, your packaging, and your social grid.",
      },
    ],
    faqs: [
      {
        question: 'Can I link to my salon booking system from Linky?',
        answer:
          'Yes. Use a Link Box block with the label "Book an appointment" pointing to your booking platform URL — Fresha, Treatwell, Booksy, Square, or any other. Linky links out to your existing booking system rather than replacing it.',
      },
      {
        question: 'Can I show a price list on my Linky page?',
        answer:
          'You can link to a price list with a Link Box block pointing to a PDF, a Google Doc, or a page on your website. For a short menu of services, a Content block can display formatted text directly on the Linky page.',
      },
      {
        question: 'Can I feature different stylists with their own booking links?',
        answer:
          'Yes. Add a Link Box block for each stylist, labelled with their name, pointing to their individual booking page. Alternatively, link to a single booking page that lets clients select the stylist they want.',
      },
      {
        question: 'How do I keep my portfolio image current?',
        answer:
          'Log in to the editor at trylinky.com/editor and update the Image block whenever you want to feature a new piece of work. If you also add an Instagram Latest Post block, that refreshes automatically every time you post, so regular clients always see something new.',
      },
      {
        question: 'Does the Map block work for salons with multiple locations?',
        answer:
          'Each Linky page can hold one Map block pinned to a specific address. If you have multiple locations, the simplest approach is to use a Link Box block labelled "Find your nearest salon" pointing to a page on your website that lists all branches.',
      },
    ],
  },

  {
    slug: 'real-estate-agents',
    name: 'Real estate agents',
    h1: 'The best link in bio for real estate agents',
    answer:
      'Linky gives real estate agents a professional link page that routes buyers and sellers to active listings, a contact or valuation request form, and neighbourhood-specific landing pages — all from the single link allowed in their social bio.',
    targetKeyword: 'link in bio for real estate agents',
    recommendedBlocks: ['link-box', 'image', 'map'],
    relatedIntegrations: [],
    recommendedTemplate: 'classic',
    sections: [
      {
        heading: 'The link-in-bio challenge for real estate agents',
        body: "Real estate agents operate across multiple channels simultaneously — Instagram, Facebook, LinkedIn, and local neighbourhood groups — each with a single bio link. The challenge is that the right destination changes constantly: a new listing goes live, an open home comes up this weekend, a market report drops. Updating a single bio URL daily is inefficient, and a static homepage does not tell a buyer or seller what you want them to do right now. A link-in-bio page solves this by surfacing all your current priorities in one place and letting you update any link instantly without touching the bio URL itself.",
      },
      {
        heading: 'Linky blocks that serve real estate agents',
        body: "Link Box blocks are the primary tool for agents: one for active listings (linking to your agency's property search filtered to your listings), one for a valuation or appraisal request form, one for an open home schedule page, and one for your contact page or calendar booking link. An Image block is effective for featuring a flagship property — a hero shot of your current best listing functions as a visual hook that makes scrollers pause. If you want to highlight a specific neighbourhood or suburb you specialise in, add a Map block centred on that area to reinforce your local expertise.",
      },
      {
        heading: 'A suggested page setup for real estate agents',
        body: "Begin with a Header block: your full name, a short professional descriptor ('Residential specialist in the Northern Beaches'), and a professional headshot — agents sell on trust, and a clear face builds that faster than a logo. Below the header, add an Image block with a strong exterior shot of your current marquee listing. Follow with your core Link Box stack: 'View my listings', 'Request a free appraisal', 'Upcoming open homes', and 'Get in touch'. If you are active on a specific platform for market commentary — LinkedIn or a blog — add a fifth Link Box for that. Keep the page clean and professional; fewer, well-labelled blocks outperform a crowded page every time.",
      },
      {
        heading: 'Keeping your page current through a fast-moving market',
        body: "Real estate pages require more active maintenance than most niches because inventory changes weekly. Update the Image block when you take on a standout new listing. Swap the 'Upcoming open homes' Link Box URL when you publish a new open home schedule. Add a temporary Link Box for a price-reduced property you want to move quickly, then remove it once it sells. Because Linky publishes changes instantly, you can update the page during an open home if something sells and redirect that link to a 'Sold — similar properties here' page. The speed of updates is one of Linky's most practical advantages for agents.",
      },
      {
        heading: 'Professional themes for real estate',
        body: "Classic — an off-white canvas with clean typography — is the default recommendation for real estate agents because it reads as professional, neutral, and trustworthy across both residential and commercial audiences. It does not distract from property images, and it mirrors the clean aesthetic of most agency websites. Midnight works well for agents who position themselves in the prestige or luxury property segment, where a darker, more exclusive feel matches the brand. Avoid highly saturated or playful themes; in real estate, the page credibility directly influences whether a potential vendor will trust you with their largest asset.",
      },
    ],
    faqs: [
      {
        question: 'Can I show my current property listings on my Linky page?',
        answer:
          'Yes. Use a Link Box block pointing to your listings page — either your agency website filtered to your properties, or a platform like Domain or Realestate.com.au. Update the link whenever your listing inventory changes.',
      },
      {
        question: 'Does Linky support booking a property appraisal?',
        answer:
          'Linky does not have a built-in appointment system, but you can link directly to your appraisal request form or calendar booking tool — Calendly, Acuity, or your own website — using a Link Box block labelled "Request a free appraisal".',
      },
      {
        question: 'Can I highlight a specific listing with an image on my Linky page?',
        answer:
          'Yes. The Image block lets you feature any image on the page — upload an exterior shot of your marquee listing or paste in a URL. Update it whenever you want to spotlight a different property.',
      },
      {
        question: 'Is Linky suitable for both buyers agents and selling agents?',
        answer:
          'Yes. Both buyer\'s agents and selling agents can structure their Linky page to match their service model — whether that is routing buyers to a search consultation, helping vendors request an appraisal, or routing landlords to a property management enquiry form.',
      },
      {
        question: 'Can I use Linky across multiple social platforms at once?',
        answer:
          'Yes. Your Linky URL is a single web address that you can paste into your bio on Instagram, Facebook, LinkedIn, and any other platform simultaneously. The page is the same for all visitors, so every channel points to the same, always-current destination.',
      },
    ],
  },

  {
    slug: 'personal-trainers',
    name: 'Personal trainers',
    h1: 'The best link in bio for personal trainers',
    answer:
      'Linky gives personal trainers a focused link page that routes followers to session bookings, online programme sales, and email list sign-ups — so every post drives real business rather than just likes.',
    targetKeyword: 'link in bio for personal trainers',
    recommendedBlocks: ['link-box', 'waitlist-email', 'image'],
    relatedIntegrations: [],
    recommendedTemplate: 'forest',
    sections: [
      {
        heading: 'Why personal trainers need a focused link in bio',
        body: "A personal trainer's social media posts do two things at once: they build credibility by showing knowledge and results, and they generate enquiries for sessions or programmes. The gap between a compelling post and a booked session is often just friction — a follower sees your content, wants to work with you, taps your bio, and then has to navigate a generic website to find a way to contact you. A link-in-bio page removes that friction by putting your booking link, your programme page, and your email sign-up on a single, fast-loading page that gets out of the way and lets the follower act.",
      },
      {
        heading: 'Linky blocks built for fitness professionals',
        body: "The Link Box block is the core tool for trainers: use one for your session booking link (Calendly, Acuity, or your own booking page), one for your online programme or app (Trainerize, TrueCoach, My PT Hub, or a Gumroad product page), and one for a results or testimonials page if you have one. The Waitlist Email block is especially powerful for trainers who run cohort-based programmes or periodically open slots: add it to the page during a launch window to capture interest without committing to a booking flow, then swap it out once the cohort is full. An Image block featuring a client result or an action shot of your training environment gives the page credibility before a visitor reads a single word.",
      },
      {
        heading: 'A suggested page setup for personal trainers',
        body: "Open with a Header block: your name, your speciality ('Online strength coach for busy professionals'), and a strong headshot or action photo. Below that, add an Image block — either a compelling before-and-after (with client permission) or a high-energy training shot that communicates the quality of your coaching. Then your Link Box stack: 'Book a session', 'Join my online programme', and 'Read client results'. If you have a running intake for a group programme, add a Waitlist Email block below the main links to capture leads between cohorts. End with a Link Box to your most popular free resource — a meal plan, a starter workout, or a YouTube video — as a low-barrier entry point for followers who are not yet ready to buy.",
      },
      {
        heading: 'Using your Linky page through a programme launch',
        body: "Linky is particularly effective during launch windows. Before a cohort opens, run a Waitlist Email block prominently to build a list of interested leads. When the programme opens, replace the waitlist block with a Link Box pointing to the enrolment or checkout page. When the cohort fills, swap the block back to a waitlist or change the label to 'Join the waitlist for the next round'. Because changes publish instantly, you can manage this cycle in real time without any code changes. The same approach works for in-person workshops, retreats, or seasonal challenges.",
      },
      {
        heading: 'Themes and professional presentation for trainers',
        body: "Forest — deep greens and earthy tones — is a strong choice for trainers whose brand runs toward outdoor fitness, functional strength, or a holistic health philosophy. It communicates seriousness and groundedness without being cold. Orange Punch suits high-energy trainers whose brand is centred on intensity, sport performance, or group fitness. Midnight works for trainers who want to project a premium or exclusive feel — it is a common choice for online coaches in the corporate or executive wellness space. Whatever theme you choose, make sure your headshot and imagery are high quality; the page design amplifies first impressions, it does not fix poor photography.",
      },
    ],
    faqs: [
      {
        question: 'Does Linky have a built-in session booking system?',
        answer:
          'Linky does not include its own booking engine, but you can link directly to your existing booking tool — Calendly, Acuity Scheduling, My PT Hub, or any other — using a Link Box block. Set the label to "Book a session" and paste your booking URL.',
      },
      {
        question: 'Can I collect client enquiries directly on my Linky page?',
        answer:
          'Yes. The Waitlist Email block captures email addresses directly on the page, which is ideal for building a list ahead of a programme launch. For more detailed enquiry forms, use a Link Box pointing to a Typeform or Google Form.',
      },
      {
        question: 'Can I sell my online training programmes through Linky?',
        answer:
          'Linky does not process payments, but you can link to your programme checkout page on any platform — Gumroad, Teachable, TrueCoach, My PT Hub, or your own website — using a Link Box block. The link takes the client directly to the purchase or enrolment page.',
      },
      {
        question: 'How do I update my page when a programme cohort opens or closes?',
        answer:
          'Log in to the editor at trylinky.com/editor and swap, add, or remove blocks as needed. Changes publish instantly, so you can open a cohort, fill it, and update the page to "waitlist only" in minutes, all without touching your social bio URL.',
      },
      {
        question: 'Can I show client testimonials or results on my Linky page?',
        answer:
          'You can feature a results image with an Image block and link to a full testimonials page with a Link Box block. For short written testimonials, a Content block lets you display formatted text directly on the page.',
      },
    ],
  },

  // ── PROFESSIONAL SET ──────────────────────────────────────────────────────────

  {
    slug: 'writers',
    name: 'Writers',
    h1: 'The best link in bio for writers',
    answer:
      'Linky gives writers a single link page that showcases published work, grows a newsletter list, and routes readers to buy books or pitches — all without needing a website or a developer.',
    targetKeyword: 'link in bio for writers',
    recommendedBlocks: ['content', 'link-box', 'waitlist-email'],
    relatedIntegrations: [],
    recommendedTemplate: 'classic',
    sections: [
      {
        heading: 'Why writers need a better bio link than a homepage',
        body: "Writers — journalists, novelists, essayists, copywriters — often have a scattered online presence: a personal website that has not been updated since a book launch, a Substack growing independently, clips spread across five publications, and social profiles pointing in different directions. A link-in-bio page acts as the connective tissue: one URL that routes agents, editors, readers, and potential clients to whatever they need without requiring a fully maintained website. It is especially useful for writers who are between projects, in the middle of a query process, or building an audience before committing to a full site.",
      },
      {
        heading: 'Linky blocks that serve writers best',
        body: "The Content block is uniquely valuable for writers because it displays rich text directly on the page — you can write a brief bio, list your recent publications, or share a short excerpt without sending visitors elsewhere. Pair it with Link Box blocks pointing to your newsletter (Substack, Beehiiv, or Ghost), your most shared or representative piece, your book on Bookshop.org or Amazon, and your pitching or editorial contact details. If you are actively building an email list, the Waitlist Email block captures subscribers directly on the page, which is often more effective than linking out to a separate sign-up form that visitors have to decide to navigate to.",
      },
      {
        heading: 'A suggested page setup for writers',
        body: "Open with a Header block: your name, your genre or beat (e.g. 'Technology essayist and journalist'), and a professional headshot. Below that, add a Content block with two or three sentences of bio copy — your publication history, your beat, and one memorable credential. Follow with your key Link Box stack: 'Read my newsletter', 'My most recent piece', 'Buy the book', and 'Pitch or commission enquiries'. If you are growing a list, place a Waitlist Email block directly below your bio — the positioning before the links captures readers who are interested before they have decided where to go, which increases sign-up rates compared to placing the form at the bottom.",
      },
      {
        heading: 'Writers building an audience before a book launch',
        body: "The pre-launch phase is when a Linky page earns its keep for writers. Use it to collect email addresses from readers who discover you months before your book or newsletter is ready. Set the Waitlist Email block to a waiting list state with copy like 'Be the first to know when the book drops' and build that list throughout the writing process. When publication day arrives, you have a warm audience to activate. After launch, swap the Waitlist Email block for a Link Box pointing to the pre-order or purchase page, and use a Content block above it to share an excerpt or the opening line — something that gives a browser a taste of the writing rather than just a buy button.",
      },
      {
        heading: 'Themes that suit writers and literary brands',
        body: "Classic — off-white with clean serif-friendly typography — is the strongest choice for most writers because it mirrors the editorial aesthetic of book pages and literary magazines. It is clean, readable, and age-neutral. Lilac works for writers in the literary fiction, poetry, or personal essay space where the audience tends toward a thoughtful, slightly softer aesthetic. Midnight suits journalists, technology writers, or thriller authors who want a sharper, more editorial feel. Whatever theme you pick, let the writing in the Content block and bio do most of the work — the page design frames the words, it does not replace them.",
      },
    ],
    faqs: [
      {
        question: 'Can I display writing samples or a bio directly on my Linky page?',
        answer:
          'Yes. The Content block displays rich formatted text directly on the page — use it for a short bio, a list of recent publications, a brief excerpt, or any editorial copy you want visitors to read before they click anywhere.',
      },
      {
        question: 'Can I grow my newsletter list through Linky?',
        answer:
          'Yes. The Waitlist Email block captures email addresses directly on your Linky page without sending visitors to a separate sign-up form. Collected addresses are stored in your Linky dashboard. You can also use a Link Box block to route visitors to your existing Substack, Beehiiv, or Ghost sign-up page.',
      },
      {
        question: 'Can I link to my published articles across multiple outlets?',
        answer:
          'Yes. Add a Link Box block for each piece or publication you want to highlight. Alternatively, use a Link Box pointing to a clips page or portfolio site that lists all your work in one place if you have a large body of published work.',
      },
      {
        question: 'Does Linky work for both fiction and non-fiction writers?',
        answer:
          'Yes. The block structure is flexible enough for any writing niche — a novelist can link to book purchase pages and a newsletter; a journalist can link to recent articles and a commission enquiry form; a copywriter can route clients to their portfolio and a contact page.',
      },
      {
        question: 'Can I use Linky as my main author web presence without a separate website?',
        answer:
          'Yes. Many writers use Linky as a lightweight alternative to a full author website, particularly at the early stages of their career or between major projects. The Content block, Header, Image, and Link Box blocks cover the core needs of an author page without requiring a domain or hosting setup.',
      },
    ],
  },

  {
    slug: 'developers',
    name: 'Developers',
    h1: 'The best link in bio for developers',
    answer:
      'Linky gives software developers a clean, credibility-first link page that shows their live GitHub commit activity, links to their portfolio and open-source projects, and routes recruiters and collaborators to the right destination in a single tap.',
    targetKeyword: 'link in bio for developers',
    recommendedBlocks: ['github-commits-this-month', 'link-box', 'content'],
    relatedIntegrations: ['github'],
    recommendedTemplate: 'midnight',
    sections: [
      {
        heading: 'Why developers benefit from a link-in-bio page',
        body: "Developers typically have a presence across GitHub, LinkedIn, a personal blog, a portfolio site, and sometimes Twitter or Bluesky — but social bios only allow one link. The result is that a recruiter who finds you on Twitter can not easily get to your GitHub, and a potential collaborator reading your LinkedIn does not know about your open-source work. A link-in-bio page aggregates every important destination in one URL and keeps them all live simultaneously, so you stop having to choose which presence to sacrifice in your bio.",
      },
      {
        heading: 'Linky blocks built for developers',
        body: "The GitHub Commits This Month block is the most distinctive feature for developers on Linky: it connects to your GitHub account and displays your real commit activity for the current month, live on the page. It is a concrete, data-driven signal of activity that says more about how you work than any self-description. Pair it with a Content block for a short technical bio — your stack, your current project focus, and what kinds of problems you are interested in. Use Link Box blocks to route visitors to your GitHub profile, portfolio or personal site, latest blog post, and any specific open-source project you want to highlight. If you are open to opportunities, a Link Box pointing to your CV or a contact form handles inbound efficiently.",
      },
      {
        heading: 'A suggested page setup for developers',
        body: "Open with a Header block: your name, a brief role description ('Full-stack engineer — TypeScript, Rust, distributed systems'), and a headshot or avatar. Below that, add the GitHub Commits This Month block — it immediately demonstrates that you are actively shipping code rather than just talking about it. Follow with a Content block summarising your current focus: the project you are building, the stack you work in, and whether you are open to contract or full-time work right now. Then your Link Box stack: 'GitHub profile', 'Portfolio', 'Latest blog post', and 'Contact or CV'. Keep the page current by updating the Content block when you change your focus or start a new project.",
      },
      {
        heading: 'Using your Linky page for job seeking and networking',
        body: "For developers who are actively job hunting or open to opportunities, the Linky page can be more effective than a LinkedIn profile for technical first impressions. The GitHub Commits This Month block shows hiring managers real work at a glance, before they have read a single line of your CV. Use a Link Box to link directly to your portfolio or the most relevant open-source repository for the role you are targeting. If you have written about a technical topic that is relevant to your target companies, a Link Box to that blog post adds depth. Update the Content block to mention the types of roles or problems you are interested in so that the page pre-qualifies inbound enquiries.",
      },
      {
        heading: 'Choosing a theme for a developer page',
        body: "Midnight — pure black — is the canonical choice for developer pages: it carries the dark-mode aesthetic that most developers live in and makes GitHub contribution-style blocks and code-adjacent content feel native. It also reads as confident and minimal, which suits the typically understated personal branding most developers prefer. If you want something lighter, Classic works for developers who prefer a clean, document-like aesthetic — common in the technical writing and open-source documentation communities. Avoid highly stylised or colourful themes unless they reflect a genuine personal brand; in the developer world, clarity and credibility matter more than visual personality.",
      },
    ],
    faqs: [
      {
        question: 'What does the GitHub Commits This Month block show?',
        answer:
          'It displays your real commit count for the current calendar month, pulled live from your connected GitHub account. It refreshes automatically and resets at the start of each month, so it always shows current activity rather than a static figure.',
      },
      {
        question: 'Do I need to connect my GitHub account to use Linky?',
        answer:
          'You only need to connect GitHub if you want to use the GitHub Commits This Month block. All other blocks — Link Box, Content, Header, and others — work without any integration. Connect your GitHub account from the Integrations tab in the editor.',
      },
      {
        question: 'Can I link to specific GitHub repositories rather than my full profile?',
        answer:
          'Yes. Use a Link Box block with the repository URL as the destination and a descriptive label — the project name and a one-line description. You can add multiple Link Box blocks to highlight different repositories.',
      },
      {
        question: 'Can I use Linky as a developer portfolio?',
        answer:
          'Linky works as a lightweight portfolio hub: use a Content block for your technical summary, Link Box blocks to route visitors to your projects, and the GitHub Commits This Month block to show live activity. For a full portfolio with project screenshots and case studies, use Linky to link to a dedicated portfolio site rather than replacing it.',
      },
      {
        question: 'Can I display a technical bio or list my tech stack on my Linky page?',
        answer:
          'Yes. The Content block displays formatted rich text directly on the page. Use it to write a short technical bio, list your primary languages and frameworks, describe your current project, or share anything that contextualises your work beyond a link list.',
      },
    ],
  },

  {
    slug: 'designers',
    name: 'Designers',
    h1: 'The best link in bio for designers',
    answer:
      'Linky gives graphic, UI, and brand designers a visually polished link page that showcases their latest work through images and live Instagram posts, routes visitors to their portfolio and Dribbble, and signals craft through the page design itself.',
    targetKeyword: 'link in bio for designers',
    recommendedBlocks: ['image', 'link-box', 'instagram-latest-post'],
    relatedIntegrations: ['instagram'],
    recommendedTemplate: 'violet',
    sections: [
      {
        heading: 'Why the bio link is a portfolio moment for designers',
        body: "For designers, everything is a portfolio moment — including the page someone lands on when they tap the link in your Instagram or Dribbble bio. A generic link-in-bio tool with no visual personality undercuts the quality of the work it is supposed to promote. The link-in-bio page is the first designed object a potential client sees when they decide to learn more about you, and it should reflect the same attention to typography, layout, and colour that you bring to client work. Linky's theming system gives designers a starting point that is coherent rather than cluttered.",
      },
      {
        heading: 'Linky blocks that work for designers',
        body: "The Image block is the centrepiece for designers: pin a piece of work — a brand identity system, a UI screen, a print layout, a typeface detail — that best represents your current practice and the type of projects you want more of. The Instagram Latest Post block keeps the page dynamically connected to your feed so recent work surfaces automatically, which is especially useful if your portfolio evolves faster than you update other platforms. Link Box blocks route clients and collaborators to your portfolio site (Dribbble, Behance, Cargo, or a custom site), your rate card or enquiry form, and your LinkedIn. Keep labels action-specific: 'See my portfolio', 'Start a project', 'Download my CV'.",
      },
      {
        heading: 'A suggested page setup for designers',
        body: "Open with a Header block: your name, a concise speciality descriptor ('Brand identity designer for early-stage startups'), and a professional headshot or a logo-avatar if you trade under a studio name. Below that, place an Image block with your strongest single piece — something that communicates your style and level of craft immediately. Follow with an Instagram Latest Post block to show momentum and recent activity. Then a Link Box stack: 'Full portfolio', 'Start a project', and optionally 'Dribbble' or 'Behance' if you are active there. If you write about design — a newsletter, a Substack, a Medium column — add a Link Box for that too; it signals depth of thinking alongside execution quality.",
      },
      {
        heading: 'Matching your Linky page design to your portfolio brand',
        body: "The theme you choose for your Linky page is itself a design decision, and potential clients will notice whether it is intentional or default. Violet suits designers who work in brand identity, editorial design, or tech products with a modern, slightly elevated aesthetic — the deep purple reads as premium and considered. Midnight is appropriate for motion designers, dark-mode UI specialists, or anyone whose work is high contrast and graphic. Classic suits Swiss-influenced minimalists, type-led designers, or anyone whose portfolio is built around restraint. Lilac works for designers in the fashion, packaging, or lifestyle space where softness and femininity are part of the brand language. Treat the theme choice as you would treat a brand audit deliverable: intentional, justified, and consistent.",
      },
      {
        heading: 'Keeping your designer page fresh without constant updates',
        body: "Designers are often the worst at maintaining their own portfolio presence because client work consumes their design time. Linky reduces the maintenance burden through the Instagram Latest Post block: once connected, it updates automatically every time you post on Instagram, so the page reflects your most recent work without you logging in to Linky. Reserve the Image block for a single pinned piece — your best, most representative work — and update it only when you complete something that genuinely displaces the current image. This two-layer approach (static hero + dynamic feed) means the page is always current at the macro level even if you only update the pinned piece once a quarter.",
      },
    ],
    faqs: [
      {
        question: 'Can I showcase specific design work on my Linky page?',
        answer:
          'Yes. The Image block lets you upload or link to any image — pin your strongest portfolio piece, a project mockup, or a detail shot of brand work. It stays displayed until you choose to update it.',
      },
      {
        question: 'Does the Instagram Latest Post block show Reels and carousels too?',
        answer:
          'The block displays the most recent post from your connected Instagram Business or Creator account. For carousels, it shows the first image in the set. Reels display as a thumbnail. It refreshes approximately once a minute as you post new content.',
      },
      {
        question: 'Can I link to both my Dribbble and Behance from Linky?',
        answer:
          'Yes. Add a Link Box block for each platform — paste the URL for your Dribbble profile in one and your Behance in another, with clear labels. You can add as many Link Box blocks as you need.',
      },
      {
        question: 'How do I handle inbound project enquiries through Linky?',
        answer:
          'Add a Link Box labelled "Start a project" or "Work with me" pointing to your enquiry form (Typeform, Google Form, or a contact page on your site). Linky routes the click to your form; it does not process project briefs or quotes directly.',
      },
      {
        question: 'Is Linky suitable for both solo designers and design studios?',
        answer:
          'Yes. Solo designers can use their own name as the username; studios can use the studio name. The editor has no restrictions on how you brand the page, and the Image and Link Box blocks work equally well whether you are showcasing personal work or a studio portfolio.',
      },
    ],
  },

  {
    slug: 'coaches',
    name: 'Coaches',
    h1: 'The best link in bio for coaches',
    answer:
      'Linky gives life, business, and career coaches a single link page that communicates their methodology, grows an email list for nurture sequences, and routes prospective clients to a discovery call — without the overhead of a full website.',
    targetKeyword: 'link in bio for coaches',
    recommendedBlocks: ['link-box', 'waitlist-email', 'content'],
    relatedIntegrations: [],
    recommendedTemplate: 'lilac',
    sections: [
      {
        heading: 'The link-in-bio challenge for coaches',
        body: "Coaching is a high-trust sale. Before a prospective client books a discovery call or buys a programme, they need to understand your philosophy, your results, and why you specifically are the right fit. Social media content builds that trust over time, but the bio link is often the moment when curiosity tips into action — or drops off because the destination is unclear. A link-in-bio page that clearly communicates what you do, who it is for, and what to do next converts that moment of intent into a tangible next step, whether that is booking a call, joining a waitlist, or subscribing to a newsletter.",
      },
      {
        heading: 'Linky blocks that serve coaches',
        body: "The Content block is essential for coaches because the coaching relationship is built on communication, and a few lines of well-written text on the page can do the work of an entire sales page introduction. Use it to explain your coaching philosophy, your client outcomes, and who you work best with. The Waitlist Email block is ideal for coaches who run cohort-based group programmes or periodic one-on-one intakes: collect interested leads between programmes without sending them to an external sign-up form. Link Box blocks handle the conversion layer: a discovery call booking link (Calendly, Acuity, or similar), your most impactful free resource (a guide, a workbook, or a video series), and your primary content platform whether that is a podcast, a YouTube channel, or a Substack.",
      },
      {
        heading: 'A suggested page setup for coaches',
        body: "Open with a Header block: your name, your coaching niche in plain language ('Executive coach for first-time managers' or 'Life coach specialising in career transitions'), and a warm, approachable headshot. Below that, a Content block with two to three sentences: what transformation you help clients achieve, who your ideal client is, and one credential or outcome that establishes credibility. Then your Waitlist Email block if you have a current programme opening, or skip it if intake is closed. Follow with your Link Box stack: 'Book a free discovery call', 'Download my free guide', and your primary content channel. End with a second Link Box for testimonials or a 'Work with me' page if you have one.",
      },
      {
        heading: 'Managing a coaching intake through Linky',
        body: "Coaches who run regular intake cycles can use Linky as a lightweight CRM entry point. Between intakes, run a Waitlist Email block to collect interested prospects and send them a confirmation via your email provider (Mailchimp, ConvertKit, ActiveCampaign) when slots open. During intake, replace the waitlist block with a Link Box pointing directly to your discovery call booking page. When you are fully booked, add a Content block above your links noting your next available intake date — it turns away unqualified leads efficiently and positions scarcity without being pushy. Update all of this from the editor in minutes, not hours.",
      },
      {
        heading: 'Themes that suit coaching brands',
        body: "Lilac is a natural fit for coaches whose practice is centred on personal growth, life transitions, or relationships — the soft, warm palette conveys approachability and psychological safety. Forest suits coaches who work in the wellbeing, somatic, or outdoor coaching space. Classic is a strong choice for executive, career, or business coaches where the brand must signal professionalism and measurability. Midnight works for high-performance and sports coaches whose brand is centred on intensity and peak performance. Avoid choosing a theme purely because it looks attractive in the editor — choose the one that your target client would look at and think 'this person understands where I am trying to get to'.",
      },
    ],
    faqs: [
      {
        question: 'Can I link to my discovery call booking from my Linky page?',
        answer:
          'Yes. Add a Link Box block labelled "Book a free discovery call" and paste your booking link — Calendly, Acuity Scheduling, TidyCal, or any other scheduling tool. Linky routes the click to your booking page; it does not schedule calls directly.',
      },
      {
        question: 'Can I collect email addresses from prospective clients on Linky?',
        answer:
          'Yes. The Waitlist Email block captures email addresses directly on the page without sending visitors to a separate form. Collected addresses are available in your Linky dashboard. Use this during intake windows or to build a list ahead of a programme launch.',
      },
      {
        question: 'Can I write about my coaching methodology directly on the page?',
        answer:
          'Yes. The Content block displays formatted rich text directly on your Linky page. Use it for a bio, a description of your coaching approach, a summary of client outcomes, or any written content that helps prospective clients understand your practice before they click a link.',
      },
      {
        question: 'Does Linky support selling coaching programmes directly?',
        answer:
          'Linky does not process payments, but you can link to your programme checkout page on Teachable, Kajabi, Gumroad, Stripe, or your own website using a Link Box block. The link takes the prospective client directly to the purchase or enrolment page.',
      },
      {
        question: 'Is Linky suitable for group coaching programmes and 1:1 coaching simultaneously?',
        answer:
          'Yes. Use separate Link Box blocks for each offering — one for your group programme page and one for 1:1 enquiries — so visitors can self-select based on what they are looking for. Update or swap blocks when your offering mix changes.',
      },
    ],
  },
];

export const niches = NICHES.filter(isPublishableNiche);
export const getNiche = (slug: string) => niches.find((n) => n.slug === slug) ?? null;
export const getNicheSlugs = () => niches.map((n) => n.slug);
