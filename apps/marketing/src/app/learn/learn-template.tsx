import { MarketingContainer } from '@/components/marketing-container';
import { LearnPostMetadata } from '@/types/mdx';

interface Props {
  children: React.ReactNode;
  meta: LearnPostMetadata;
}

export function ArticleTemplate({ children, meta }: Props) {
  return (
    <article itemScope itemType="https://schema.org/FAQPage">
      <div
        itemScope
        itemProp="mainEntity"
        itemType="https://schema.org/Question"
        className="flex flex-col min-h-[calc(100vh-12rem)]"
      >
        <section className="border-b border-zinc-950/5 bg-linear-to-b from-white to-[#F5F5F3] pb-12 pt-32 md:pt-40">
          <MarketingContainer>
            <header className="flex max-w-3xl flex-col">
              <p className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                <span className="inline-block h-px w-6 bg-zinc-300" />
                Learn
              </p>
              <h1
                itemProp="name"
                className="mt-4 text-pretty text-4xl font-semibold tracking-tight text-zinc-900 lg:text-5xl"
              >
                {meta.title}
              </h1>
              <time
                dateTime={meta.publishDate}
                className="mt-5 text-sm text-zinc-500"
              >
                Last updated:{' '}
                {Intl.DateTimeFormat('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }).format(new Date(meta.publishDate))}
              </time>
            </header>
          </MarketingContainer>
        </section>
        <section className="flex-1 py-16">
          <MarketingContainer>
            <div
              itemScope
              itemProp="acceptedAnswer"
              itemType="https://schema.org/Answer"
            >
              <div itemProp="text" className="prose prose-lg prose-zinc max-w-3xl">
                {children}
              </div>
            </div>
          </MarketingContainer>
        </section>
      </div>
    </article>
  );
}
