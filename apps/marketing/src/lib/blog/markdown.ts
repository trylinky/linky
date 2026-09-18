import slugify from '@sindresorhus/slugify';
import type { Root } from 'mdast';
import { toString } from 'mdast-util-to-string';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

export type TocEntry = { level: number; title: string; id: string };

// Gives every heading an id so the table of contents can link to it.
export function remarkHeadingIds() {
  return (tree: Root) => {
    visit(tree, 'heading', (node) => {
      node.data = {
        ...node.data,
        hProperties: { id: slugify(toString(node)), className: 'toc-anchor' },
      };
    });
  };
}

// The active-heading tracker only follows h2-h4, so the TOC matches that.
export function getTableOfContents(markdown: string): TocEntry[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const toc: TocEntry[] = [];

  visit(tree, 'heading', (node) => {
    if (node.depth < 2 || node.depth > 4) return;
    const title = toString(node);
    toc.push({ level: node.depth, title, id: slugify(title) });
  });

  return toc;
}
