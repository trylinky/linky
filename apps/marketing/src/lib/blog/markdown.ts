import slugify from '@sindresorhus/slugify';
import type { Root } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';

// Gives every heading an id so sections can be linked to directly.
export function remarkHeadingIds() {
  return (tree: Root) => {
    visit(tree, 'heading', (node) => {
      node.data = {
        ...node.data,
        hProperties: { id: slugify(toString(node)) },
      };
    });
  };
}
