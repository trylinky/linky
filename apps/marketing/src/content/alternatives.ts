import type { AlternativeContent } from '@/content/pseo-types';
import { isPublishableAlternative } from '@/content/pseo-types';

const ALTERNATIVES: AlternativeContent[] = [
  {
    slug: 'linktree',
    competitor: 'Linktree',
    h1: 'Linky: the Linktree alternative built for rich, expressive pages',
    answer:
      'Linky is a link-in-bio builder that goes beyond a plain list of links, offering rich content blocks — including live Spotify, Instagram, GitHub, and more — alongside custom domains and a polished theming system.',
    targetKeyword: 'linktree alternative',
    sections: [
      {
        heading: 'What to look for in a Linktree alternative',
        body: 'A Linktree alternative should do more than host a numbered list of URLs. The most important things to consider are the variety of content blocks available, how much you can customise the look and feel of your page, whether you can use a custom domain, and what the analytics look like. Some tools bolt on features as paid add-ons; others include them in a single affordable tier. Think about which content types matter to you — music, social feeds, writing, code — before committing to any platform.',
      },
      {
        heading: 'Where Linky stands out',
        body: 'Linky was built around the idea that a link-in-bio page should feel like a real piece of your online identity, not a glorified bookmark list. It ships with rich content blocks out of the box: a live Spotify "now playing" block, an Instagram latest-post block, a TikTok follower-count block, a GitHub recent-commits block, a YouTube embed, an interactive map, a waitlist/email capture block, and more. These pull in live data so your page stays fresh without manual updates.\n\nOn the customisation side, Linky offers custom colour palettes and font pairings through its themes system. Custom domains are available on the Premium plan ($4/month), along with unlimited pages and blocks, a verification badge, private pages, and page analytics. The Team plan ($14/month) adds a shared team space, up to five seats, and integrations with Google Analytics and Facebook Pixel.',
      },
      {
        heading: 'What Linktree is genuinely good at',
        body: 'Linktree is the most recognised name in the space and has been around since 2016, which means it has a large ecosystem of integrations and a well-documented onboarding flow. Its free tier is broadly accessible, and its Pro and Premium tiers include scheduling, priority links, and a marketplace of third-party integrations. If you are already deep in the Linktree ecosystem or your team is familiar with it, switching does carry a switching cost worth considering.',
      },
      {
        heading: 'Switching to Linky',
        body: 'Getting started with Linky takes a few minutes. Sign up for free, claim your username, and start adding blocks from the editor. When you are ready, connect your social accounts for live feed blocks, pick a theme, and point your custom domain (Premium plan required). You can recreate your Linktree links one by one in the links block — there is no automated import, but most pages are small enough that this is quick. Once live, update your Instagram bio, TikTok bio, and anywhere else you link from.',
      },
      {
        heading: 'Who should choose Linky',
        body: 'Linky is a strong fit for creators who want their page to feel alive — musicians who want Spotify playback, developers who want to show recent commits, creators with active Instagram or TikTok accounts. It is also a good option for small teams that need a shared workspace without enterprise pricing. If a plain list of links is all you need and you are happy on Linktree\'s free tier, there may be less reason to switch; but if you have outgrown that model, Linky is worth a look.',
      },
    ],
    faqs: [
      {
        question: 'Is Linky free?',
        answer:
          'Linky has a free plan that lets you create your own page and add blocks. Paid plans (Premium at $4/month and Team at $14/month) unlock custom domains, unlimited pages and blocks, analytics, private pages, and team features.',
      },
      {
        question: 'Can I move my links from Linktree to Linky?',
        answer:
          'There is no automated import from Linktree, but recreating your links in Linky is straightforward — paste each URL into a link block in the editor. Most link-in-bio pages are small enough that this takes only a few minutes.',
      },
      {
        question: 'How is Linky different from Linktree?',
        answer:
          'Linky focuses on rich content blocks that pull in live data — Spotify, Instagram, GitHub, TikTok, and more — so your page stays dynamic without manual updates. Linktree is primarily a link-list tool with add-ons; Linky treats live integrations as a core part of the product.',
      },
      {
        question: 'Does Linky support custom domains?',
        answer:
          'Yes. Custom domains are available on the Premium plan ($4/month) and above. You point your domain to Linky\'s servers and the page is served under your own URL.',
      },
      {
        question: 'Does Linky have analytics?',
        answer:
          'Page analytics are included in the Premium plan. The Team plan also adds Google Analytics and Facebook Pixel integrations for more detailed tracking.',
      },
    ],
    comparison: [
      {
        feature: 'Rich content blocks (Spotify, Instagram, GitHub, etc.)',
        linky: 'Yes — live data blocks built in',
        competitor: 'Limited; mostly link-list focused',
      },
      {
        feature: 'Custom domain',
        linky: 'Premium plan ($4/month)',
        competitor: 'Available on paid plans',
      },
      {
        feature: 'Page analytics',
        linky: 'Included in Premium',
        competitor: 'Available on paid plans',
      },
      {
        feature: 'Team workspace',
        linky: 'Team plan — up to 5 seats ($14/month)',
        competitor: 'Available on higher-tier plans',
      },
      {
        feature: 'Free tier',
        linky: 'Yes — free page with blocks',
        competitor: 'Yes — free to start',
      },
    ],
  },

  {
    slug: 'beacons',
    competitor: 'Beacons',
    h1: 'Linky: a Beacons alternative focused on expressive live-data pages',
    answer:
      'Linky is a link-in-bio builder with live social and music blocks, custom theming, and an affordable paid tier — a focused alternative to Beacons for creators who want a clean, fast page without a built-in storefront.',
    targetKeyword: 'beacons alternative',
    sections: [
      {
        heading: 'What to look for in a Beacons alternative',
        body: 'Beacons packages a link page, a media kit, and a creator store into one platform. When evaluating alternatives, consider which of those features you actually use. If you do not sell digital products or sponsorships through your link page, a leaner tool may load faster, look cleaner, and cost less. The most relevant factors are live social integrations, customisation depth, custom domain support, and how the analytics stack up.',
      },
      {
        heading: 'Where Linky stands out',
        body: 'Linky is purpose-built around live content blocks. Its Instagram block pulls in your latest post and follower count; the Spotify block shows what you are currently listening to or your latest release; the TikTok block displays follower count and recent posts; the GitHub block shows recent commits. These make a Linky page feel current without daily maintenance.\n\nLinky\'s theming system lets you pick custom colour palettes and fonts, giving your page a distinct look that matches your brand. Custom domains are available on the Premium plan at $4/month, which also includes unlimited pages and blocks, a verification badge, private pages, and analytics. The Team plan ($14/month) adds a shared workspace for up to five collaborators and support for Google Analytics and Facebook Pixel.',
      },
      {
        heading: 'What Beacons is genuinely good at',
        body: 'Beacons is a strong choice for creators whose business model centres on monetisation through the link page itself — selling presets, LUTs, ebooks, or other digital products, or managing brand deal inquiries via its media kit features. Its free tier is generous, and it has built a reputation among YouTube and TikTok creators. If commerce and media kit features are central to your workflow, Beacons is worth evaluating on its own merits.',
      },
      {
        heading: 'Getting started with Linky',
        body: 'Sign up at trylinky.com, choose a username, and open the editor. Add a links block for your key URLs, then layer in live blocks for your active social accounts — Instagram, Spotify, TikTok, GitHub, or YouTube. Choose a theme to match your visual identity. Once the page is ready, upgrade to Premium if you want a custom domain or analytics, then swap the URL in your social bios.',
      },
      {
        heading: 'Who should choose Linky',
        body: 'Linky is a good fit for creators and developers who want a live, content-rich page and do not need a built-in storefront. Musicians, visual artists, developers, and anyone with active social accounts that they want surfaced directly on their page will get the most from Linky\'s live-data blocks. Teams that collaborate on a shared page benefit from the Team plan\'s workspace and seat management.',
      },
    ],
    faqs: [
      {
        question: 'Is Linky free?',
        answer:
          'Yes. Linky has a free plan. Premium ($4/month) adds custom domains, unlimited blocks, analytics, and private pages. Team ($14/month) adds shared workspaces and up to five seats.',
      },
      {
        question: 'Can I move my page from Beacons to Linky?',
        answer:
          'There is no one-click import, but it is straightforward to recreate your links and social blocks in Linky\'s editor. Most link-in-bio pages can be rebuilt in a short sitting.',
      },
      {
        question: 'How is Linky different from Beacons?',
        answer:
          'Beacons includes a creator storefront and media kit tools. Linky focuses on live content blocks — Spotify, Instagram, GitHub, TikTok, and more — and clean, customisable pages. If you do not need a built-in commerce layer, Linky gives you a leaner, faster page.',
      },
      {
        question: 'Does Linky support custom domains?',
        answer:
          'Yes, on the Premium plan ($4/month) and above. You connect your domain through the settings panel and the page is served at your own URL.',
      },
    ],
    comparison: [
      {
        feature: 'Live social/music blocks',
        linky: 'Yes — Spotify, Instagram, TikTok, GitHub, YouTube, and more',
        competitor: 'Social embeds available',
      },
      {
        feature: 'Custom domain',
        linky: 'Premium plan ($4/month)',
        competitor: 'Available on paid plans',
      },
      {
        feature: 'Built-in storefront',
        linky: 'Not included',
        competitor: 'Yes — digital products and tipping',
      },
      {
        feature: 'Team workspace',
        linky: 'Team plan — up to 5 seats ($14/month)',
        competitor: 'Collaboration features available',
      },
      {
        feature: 'Page analytics',
        linky: 'Included in Premium',
        competitor: 'Available on paid plans',
      },
    ],
  },

  {
    slug: 'bio-link',
    competitor: 'Bio.link',
    h1: 'Linky: the Bio.link alternative with live integrations and custom themes',
    answer:
      'Linky offers live social and music blocks, deep theme customisation, and custom domain support — a step up from Bio.link for creators who want a page that does more than list links.',
    targetKeyword: 'bio link alternative',
    sections: [
      {
        heading: 'What to look for in a Bio.link alternative',
        body: 'Bio.link is known for being simple and free. When you outgrow a basic link list, the things worth looking for in an alternative are live content integrations (music, social feeds, code activity), a proper theming system with font and colour control, custom domain support, and useful analytics. A platform that charges a fair single price for the full feature set — rather than piecemeal add-ons — is also worth prioritising.',
      },
      {
        heading: 'Where Linky stands out',
        body: 'Linky\'s block library is what separates it from simpler tools. Beyond standard link blocks, you get a live Spotify "now playing" block, an Instagram latest-post-and-follower-count block, a TikTok follower and recent-post block, a GitHub commits block, a YouTube embed, an interactive map, reactions, and a waitlist/email capture block. These pull real data, so your page reflects your current activity without manual updates.\n\nThe theming system gives you control over colours and fonts, and every Linky page can be styled to match your brand identity. Premium ($4/month) adds custom domains, unlimited blocks and pages, a verification badge, private pages, and analytics. Team ($14/month) adds a shared workspace with up to five seats, Google Analytics, and Facebook Pixel.',
      },
      {
        heading: 'What Bio.link is genuinely good at',
        body: 'Bio.link has a very low barrier to entry — no account required to preview, clean interface, and a generous free tier. For users who need nothing more than a tidy list of links up quickly, Bio.link delivers that with minimal friction. Its simplicity is a genuine strength for straightforward use cases.',
      },
      {
        heading: 'Switching from Bio.link to Linky',
        body: 'Because both tools are link-in-bio builders, migration is manual but fast. Sign up on Linky, add your links in the editor, and layer in any live blocks relevant to your accounts (Spotify, Instagram, TikTok, GitHub). Pick a theme that fits your aesthetic, then upgrade to Premium if you need your own domain or want to track page analytics. Swap the URL in your social bios and you are live.',
      },
      {
        heading: 'Who should choose Linky over Bio.link',
        body: 'Anyone who wants their link page to feel like a living profile — pulling in music, social media activity, or code contributions automatically — will find Linky a much better fit. Creators who care about branding (custom colours, fonts, domain) and teams that need to manage a shared page will also benefit. Bio.link remains a fine option if speed of setup is your only criterion, but Linky provides meaningfully more for a small monthly investment.',
      },
    ],
    faqs: [
      {
        question: 'Is Linky free?',
        answer:
          'Yes — Linky has a free plan. The Premium plan is $4/month and adds custom domains, unlimited blocks, analytics, and more. The Team plan is $14/month.',
      },
      {
        question: 'Can I import my Bio.link page to Linky?',
        answer:
          'There is no automated import from Bio.link. You recreate your links in Linky\'s editor, which is quick since most link-in-bio pages have a small number of entries.',
      },
      {
        question: 'How is Linky different from Bio.link?',
        answer:
          'Bio.link focuses on a simple, fast link list. Linky adds live content blocks — Spotify, Instagram, TikTok, GitHub, and more — along with a full theming system and custom domain support. If you want more than links, Linky is the stronger choice.',
      },
      {
        question: 'Does Linky have a custom domain option?',
        answer:
          'Yes. Custom domains are included in the Premium plan ($4/month). You connect your domain in settings and the page is served at your own URL.',
      },
      {
        question: 'What blocks does Linky support?',
        answer:
          'Linky supports header blocks, link blocks (link-box and link-bar styles), image blocks, rich text/content blocks, Spotify (now playing), Instagram (latest post + follower count), TikTok (follower count + latest post), Threads (follower count), GitHub (commits), YouTube, Maps, reactions, and a waitlist/email capture block.',
      },
    ],
    comparison: [
      {
        feature: 'Live social and music integrations',
        linky: 'Yes — Spotify, Instagram, TikTok, GitHub, YouTube, and more',
        competitor: 'Basic social icons/links',
      },
      {
        feature: 'Custom themes (colours + fonts)',
        linky: 'Yes — full colour palette and font control',
        competitor: 'Limited customisation',
      },
      {
        feature: 'Custom domain',
        linky: 'Premium plan ($4/month)',
        competitor: 'Available on paid plans',
      },
      {
        feature: 'Page analytics',
        linky: 'Included in Premium',
        competitor: 'Available on paid plans',
      },
      {
        feature: 'Team workspace',
        linky: 'Team plan — up to 5 seats ($14/month)',
        competitor: 'Not a primary focus',
      },
    ],
  },

  {
    slug: 'carrd',
    competitor: 'Carrd',
    h1: 'Linky: a Carrd alternative purpose-built for link-in-bio with live social blocks',
    answer:
      'Linky is a dedicated link-in-bio tool with live Spotify, Instagram, TikTok, and GitHub blocks, custom themes, and custom domains — complementing Carrd for creators who want a social-first page rather than a general one-page site.',
    targetKeyword: 'carrd alternative',
    sections: [
      {
        heading: 'What to look for in a Carrd alternative',
        body: 'Carrd is a general-purpose one-page site builder. It is flexible but requires more manual setup for a link-in-bio use case — you design layouts from scratch, there are no live social feed blocks, and keeping your page current means updating it yourself. When looking for a Carrd alternative for bio-link use, the key differentiators are native social integrations that update automatically, a fast no-code editor optimised for the link-in-bio format, and affordable pricing for a dedicated page.',
      },
      {
        heading: 'Where Linky stands out',
        body: 'Linky is purpose-built for link-in-bio pages. Its editor is structured around blocks that work together out of the box, and its live integrations are the standout feature: Spotify shows your currently-playing track or latest release; Instagram surfaces your most recent post and follower count; TikTok shows follower count and recent posts; GitHub displays recent commit activity. These update automatically, so your page always reflects your current output.\n\nLinky\'s theming system provides custom colour palettes and font choices without requiring design skills. Custom domains are included in the Premium plan at $4/month, along with unlimited blocks, unlimited pages, a verification badge, private pages, and analytics. The Team plan at $14/month adds a shared workspace for up to five people and support for Google Analytics and Facebook Pixel.',
      },
      {
        heading: 'What Carrd is genuinely good at',
        body: 'Carrd is an excellent tool for building small, custom single-page websites — landing pages, portfolios, personal sites, and simple forms. Its layout flexibility and low price point ($19/year for the Pro Standard plan at time of writing) make it appealing for designers and developers who want pixel-level control. If you need a fully custom layout, embed arbitrary HTML/CSS, or build something beyond a link page, Carrd handles that well. Linky is not a general site builder; if that flexibility matters to you, Carrd has real strengths.',
      },
      {
        heading: 'Getting started with Linky',
        body: 'Sign up at trylinky.com, choose a username, and the editor opens immediately. Add a links block for your key URLs, then pick which live blocks are relevant — music on Spotify, your latest Instagram posts, GitHub activity, or a YouTube embed. Select a theme or customise colours and fonts. Upgrade to Premium to connect a custom domain or access analytics. Finally, replace the link in your Instagram or TikTok bio with your new Linky URL.',
      },
      {
        heading: 'Who should choose Linky vs Carrd',
        body: 'Choose Linky if you primarily need a link-in-bio page that pulls in live social data and looks great in a mobile browser. It is the faster path to a polished, dynamic page without design work. Choose Carrd if you need a fully custom one-page website with layouts, forms, and HTML control that goes beyond a bio page. The two tools serve overlapping but distinct needs, and some creators even use both.',
      },
    ],
    faqs: [
      {
        question: 'Is Linky free?',
        answer:
          'Yes — Linky has a free plan. Premium is $4/month and adds custom domains, unlimited blocks and pages, a verification badge, private pages, and analytics. Team is $14/month.',
      },
      {
        question: 'Can I replace my Carrd site with Linky?',
        answer:
          'If your Carrd site is primarily a link-in-bio page, Linky can replace it with a more focused experience and live social blocks. If you use Carrd for a fully custom-layout portfolio or landing page, Linky would be a complement rather than a direct replacement.',
      },
      {
        question: 'How is Linky different from Carrd?',
        answer:
          'Carrd is a flexible one-page site builder. Linky is a dedicated link-in-bio tool with live integrations (Spotify, Instagram, TikTok, GitHub) that update automatically. Linky requires less design effort for a bio-link page and keeps content current without manual updates.',
      },
      {
        question: 'Does Linky support custom domains like Carrd?',
        answer:
          'Yes. Custom domains are available on Linky\'s Premium plan ($4/month). You connect your domain in settings; no technical setup beyond a DNS change is required.',
      },
      {
        question: 'Does Linky work well on mobile?',
        answer:
          'Yes — Linky pages are designed for mobile-first viewing, which is how most visitors arrive from a social media bio link.',
      },
    ],
    comparison: [
      {
        feature: 'Purpose-built for link-in-bio',
        linky: 'Yes — editor and blocks optimised for bio pages',
        competitor: 'General one-page site builder; bio-link is a use case, not the focus',
      },
      {
        feature: 'Live social/music blocks',
        linky: 'Yes — Spotify, Instagram, TikTok, GitHub, YouTube, and more',
        competitor: 'Not natively supported; requires manual embeds',
      },
      {
        feature: 'Custom domain',
        linky: 'Premium plan ($4/month)',
        competitor: 'Available on paid plans',
      },
      {
        feature: 'Page analytics',
        linky: 'Included in Premium',
        competitor: 'Available on paid plans',
      },
      {
        feature: 'Team workspace',
        linky: 'Team plan — up to 5 seats ($14/month)',
        competitor: 'Not a primary feature',
      },
    ],
  },

  {
    slug: 'later',
    competitor: 'Later',
    h1: 'Linky: a Later link-in-bio alternative with live blocks and custom domains',
    answer:
      'Linky is a standalone link-in-bio builder with live Spotify, Instagram, TikTok, and GitHub blocks, custom theming, and custom domains — a focused alternative to Later\'s link-in-bio feature for creators who do not need a full social scheduling suite.',
    targetKeyword: 'later link in bio alternative',
    sections: [
      {
        heading: 'What to look for in a Later link-in-bio alternative',
        body: 'Later is primarily a social media scheduling platform; its link-in-bio tool (Linkin.bio) is one feature within a broader suite aimed at marketing teams. When evaluating alternatives, consider whether you actually use Later\'s scheduling features or mainly use Linkin.bio in isolation. A dedicated link-in-bio tool may offer deeper block variety, better theming options, and a simpler pricing model if scheduling is not part of your workflow.',
      },
      {
        heading: 'Where Linky stands out',
        body: 'Linky is built exclusively for link-in-bio pages, so every part of the product is optimised for that use case. Its live blocks are a core differentiator: the Instagram block shows your latest post and follower count; the Spotify block displays what you are currently listening to; the TikTok block surfaces follower count and recent posts; the GitHub block shows recent commits; YouTube, Maps, and a waitlist/email-capture block round out the library.\n\nCustomisation goes further than most tools — you pick custom colour palettes and fonts through the themes system. Custom domains are available on the Premium plan ($4/month), which also includes unlimited blocks and pages, a verification badge, private pages, and page analytics. The Team plan ($14/month) adds a shared workspace for up to five seats with Google Analytics and Facebook Pixel integrations.',
      },
      {
        heading: 'What Later is genuinely good at',
        body: 'Later is a mature social media management platform with strong scheduling, media library management, analytics across multiple social accounts, and team collaboration tools built for marketing workflows. Its Linkin.bio product is tightly integrated with that scheduling workflow, allowing posts to be automatically added to the link page. If your team already uses Later for social scheduling and wants the link page to stay in sync with your publishing calendar, that integration is genuinely valuable.',
      },
      {
        heading: 'Getting started with Linky',
        body: 'Getting started with Linky is quick: sign up, claim your username, and the editor is ready immediately. Add a links block for your main URLs, connect your Instagram and Spotify accounts for live blocks, choose a theme, and go. If you need your own domain, upgrade to Premium and connect it through the settings panel. Once live, update the link in your Instagram bio, TikTok bio, and anywhere else you currently point to Later\'s Linkin.bio URL.',
      },
      {
        heading: 'Who should choose Linky over Later',
        body: 'Linky is the right choice for creators and small teams who want a rich, customisable link-in-bio page without paying for a full social media management suite. If you schedule social content through a separate tool or manually, Linky gives you a better link page for significantly less. Later remains the stronger choice for marketing teams that need social scheduling and analytics across multiple accounts in one place.',
      },
    ],
    faqs: [
      {
        question: 'Is Linky free?',
        answer:
          'Yes — Linky has a free plan. Premium is $4/month and includes custom domains, unlimited blocks and pages, a verification badge, private pages, and analytics. Team is $14/month with shared workspaces and up to five seats.',
      },
      {
        question: 'Can I move from Later\'s Linkin.bio to Linky?',
        answer:
          'Yes. There is no automated import, but recreating your links and adding live blocks in Linky\'s editor is straightforward. Once your page is live, update the link in your social bios from your Later Linkin.bio URL to your new Linky URL.',
      },
      {
        question: 'How is Linky different from Later?',
        answer:
          'Later is a full social media scheduling and management platform; its link-in-bio tool is one feature within that suite. Linky is dedicated exclusively to link-in-bio pages, with a richer block library (live Spotify, Instagram, GitHub, TikTok, and more) and a lower price point for the page-only use case.',
      },
      {
        question: 'Does Linky integrate with Instagram like Later does?',
        answer:
          'Linky\'s Instagram block pulls in your latest post and follower count automatically. It does not offer a full social scheduling workflow — if you need to schedule posts, you would use a separate scheduling tool alongside Linky.',
      },
      {
        question: 'Does Linky support team collaboration?',
        answer:
          'Yes. The Team plan ($14/month) provides a shared team workspace with up to five seats, plus Google Analytics and Facebook Pixel integrations.',
      },
    ],
    comparison: [
      {
        feature: 'Primary purpose',
        linky: 'Dedicated link-in-bio builder',
        competitor: 'Social media scheduling suite with a link-in-bio feature',
      },
      {
        feature: 'Live social/music blocks',
        linky: 'Yes — Spotify, Instagram, TikTok, GitHub, YouTube, and more',
        competitor: 'Instagram feed integration tied to scheduling workflow',
      },
      {
        feature: 'Custom domain',
        linky: 'Premium plan ($4/month)',
        competitor: 'Available on paid plans',
      },
      {
        feature: 'Page analytics',
        linky: 'Included in Premium',
        competitor: 'Available on paid plans',
      },
      {
        feature: 'Team workspace',
        linky: 'Team plan — up to 5 seats ($14/month)',
        competitor: 'Team collaboration included in social management plans',
      },
    ],
  },
];

export const alternatives = ALTERNATIVES.filter(isPublishableAlternative);
export const getAlternative = (slug: string) => alternatives.find((a) => a.slug === slug) ?? null;
export const getAlternativeSlugs = () => alternatives.map((a) => a.slug);
