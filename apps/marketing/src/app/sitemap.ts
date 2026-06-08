import { getLearnPosts } from '@/app/learn/utils';
import { getBlogPosts } from '@/lib/cms/get-blog-posts';
import { MetadataRoute } from 'next';

const baseUrl = `https://lin.ky`;

// IMPORTANT: We deliberately DO NOT enumerate public user pages (lin.ky/<slug>)
// in the sitemap. Thousands of thin user pages would dilute root-domain authority
// and feed scaled-content signals. User pages are indexed individually only when
// they pass the quality gate (see @trylinky/seo `shouldIndexPage`). Do not add them.
//
// Spec 2 will append programmatic SEO routes (integration/template/use-case/
// alternative pages) to `pseoSitemap` below.
const pseoSitemap: MetadataRoute.Sitemap = [];

const baseSitemap = [
  {
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1,
  },
  {
    url: `${baseUrl}/i/pricing`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${baseUrl}/i/terms`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.4,
  },
  {
    url: `${baseUrl}/i/privacy`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.4,
  },
  {
    url: `${baseUrl}/i/tiktok`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.4,
  },
  {
    url: `${baseUrl}/i/explore`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.4,
  },
];
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogSitemap = await generateBlogSitemap(baseUrl);
  const learnSitemap = await generateLearnSitemap(baseUrl);

  return [
    ...baseSitemap,
    ...pseoSitemap,
    ...blogSitemap,
    ...learnSitemap,
  ] as MetadataRoute.Sitemap;
}

const generateBlogSitemap = async (baseUrl: string) => {
  const blogPosts = await getBlogPosts();

  const blogSitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/i/blog/${post.slug}`,
    lastModified: new Date(post.displayedPublishedAt),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [
    {
      url: `${baseUrl}/i/blog`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...blogSitemap,
  ];
};

const generateLearnSitemap = async (baseUrl: string) => {
  const posts = await getLearnPosts();

  const postsSitemap = posts.map((post) => ({
    url: `${baseUrl}/i/learn/${post.slug}`,
    lastModified: new Date(post.publishDate),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [
    {
      url: `${baseUrl}/i/learn`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...postsSitemap,
  ];
};
