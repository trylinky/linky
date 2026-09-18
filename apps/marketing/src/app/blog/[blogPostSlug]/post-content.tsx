import { remarkHeadingIds } from '@/lib/blog/markdown';
import { resolveBlogAssetUrl } from '@/lib/blog/posts';
import type { Element, ElementContent } from 'hast';
import Link from 'next/link';
import Markdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';

function textOf(node: ElementContent): string {
  if (node.type === 'text') return node.value;
  if (node.type === 'element') return node.children.map(textOf).join('');
  return '';
}

// A bare YouTube URL on its own line is rendered as an embedded player.
function youTubeEmbedUrl(paragraph: Element | undefined): string | null {
  const children = paragraph?.children.filter(
    (child) => !(child.type === 'text' && !child.value.trim())
  );
  const link = children?.length === 1 ? children[0] : undefined;
  if (link?.type !== 'element' || link.tagName !== 'a') return null;

  const href = String(link.properties.href ?? '');
  if (textOf(link) !== href) return null;

  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtube.com' && url.pathname.startsWith('/embed/')) {
      return href;
    }
    if (host === 'youtube.com' && url.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${url.searchParams.get('v')}`;
    }
    if (host === 'youtu.be') {
      return `https://www.youtube.com/embed${url.pathname}`;
    }
  } catch {}

  return null;
}

export function PostContent({ content }: { content: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm, remarkHeadingIds]}
      urlTransform={(url) => defaultUrlTransform(resolveBlogAssetUrl(url))}
      components={{
        p: ({ node, children }) => {
          const embedUrl = youTubeEmbedUrl(node);
          if (!embedUrl) return <p>{children}</p>;

          return (
            <div className="not-prose my-8 aspect-video">
              <iframe
                src={embedUrl}
                title="YouTube video"
                className="h-full w-full rounded-xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        },
        a: ({ href = '', title, children }) => {
          if (href.startsWith('/')) {
            return (
              <Link href={href} title={title}>
                {children}
              </Link>
            );
          }

          const isOwnSite = /^https?:\/\/(www\.)?lin\.ky(\/|$)/.test(href);
          return (
            <a
              href={href}
              title={title}
              {...(!isOwnSite && {
                target: '_blank',
                rel: 'noopener noreferrer',
              })}
            >
              {children}
            </a>
          );
        },
        img: ({ src, alt }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={typeof src === 'string' ? src : undefined}
            alt={alt ?? ''}
            loading="lazy"
          />
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto">
            <table>{children}</table>
          </div>
        ),
      }}
    >
      {content}
    </Markdown>
  );
}
