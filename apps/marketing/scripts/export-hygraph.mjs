// One-off export of the Hygraph blog into markdown files for the blog content
// repo. Writes posts/<slug>.md and downloads every image into images/<slug>/.
//
// Usage (from apps/marketing):
//   dotenvx run -f ../../.env.local -- node scripts/export-hygraph.mjs <output-dir>
//
// Requires HYGRAPH_ENDPOINT and HYGRAPH_TOKEN. Only the PUBLISHED stage is
// exported.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const { HYGRAPH_ENDPOINT, HYGRAPH_TOKEN } = process.env;
const outputDir = process.argv[2];

if (!HYGRAPH_ENDPOINT || !HYGRAPH_TOKEN) {
  console.error('HYGRAPH_ENDPOINT and HYGRAPH_TOKEN must be set');
  process.exit(1);
}

if (!outputDir) {
  console.error('Usage: node scripts/export-hygraph.mjs <output-dir>');
  process.exit(1);
}

const POSTS_QUERY = `
  query ExportBlogPosts($first: Int!, $skip: Int!) {
    blogPosts(first: $first, skip: $skip, orderBy: displayedPublishedAt_DESC) {
      slug
      title
      description
      author
      displayedPublishedAt
      featuredImage {
        url
        fileName
        mimeType
      }
      content {
        raw
      }
    }
  }
`;

const EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
};

async function request(query, variables) {
  const response = await fetch(HYGRAPH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${HYGRAPH_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  if (body.errors) {
    throw new Error(JSON.stringify(body.errors));
  }
  return body.data;
}

async function fetchAllPosts() {
  const pageSize = 100;
  const posts = [];
  for (let skip = 0; ; skip += pageSize) {
    const { blogPosts } = await request(POSTS_QUERY, { first: pageSize, skip });
    posts.push(...blogPosts);
    if (blogPosts.length < pageSize) return posts;
  }
}

function extensionFor(mimeType, fileName) {
  if (EXTENSIONS[mimeType]) return EXTENSIONS[mimeType];
  const fromName = path
    .extname(fileName ?? '')
    .slice(1)
    .toLowerCase();
  if (fromName) return fromName;
  throw new Error(`Unknown image type: ${mimeType} (${fileName})`);
}

async function fetchWithRetry(url, attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      if (attempt >= attempts) {
        throw new Error(`Failed to download ${url}: ${error.message}`);
      }
    }
  }
}

// Downloads an asset into images/<slug>/<name> and returns the path relative
// to the post file, which is how posts reference images.
async function downloadImage(url, slug, name) {
  const response = await fetchWithRetry(url);
  const dir = path.join(outputDir, 'images', slug);
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, name),
    Buffer.from(await response.arrayBuffer())
  );
  return `../images/${slug}/${name}`;
}

// --- Rich text to markdown ---------------------------------------------------
//
// Hygraph content mixes its own Slate nodes (bulleted-list, list-item-child,
// block-quote...) with mdast-style nodes (list, listItem, blockquote, code,
// strong/inlineCode marks) from content that was pasted in as markdown. Both
// are handled here.

function escapeText(text) {
  return (
    text
      .replace(/\\/g, '\\\\')
      .replace(/([*`])/g, '\\$1')
      // Underscores only need escaping when they are not inside a word.
      .replace(/_/g, (match, offset, whole) =>
        /[a-z0-9]/i.test(whole[offset - 1] ?? '') &&
        /[a-z0-9]/i.test(whole[offset + 1] ?? '')
          ? match
          : '\\_'
      )
  );
}

function marksOf(node) {
  return {
    bold: Boolean(node.bold || node.strong),
    italic: Boolean(node.italic),
    code: Boolean(node.code || node.inlineCode),
  };
}

function sameMarks(a, b) {
  const ma = marksOf(a);
  const mb = marksOf(b);
  return ma.bold === mb.bold && ma.italic === mb.italic && ma.code === mb.code;
}

function renderText(node) {
  const { bold, italic, code } = marksOf(node);
  if (code) {
    const text = node.text;
    if (!text) return '';
    const fence = text.includes('`') ? '``' : '`';
    return `${fence}${text}${fence}`;
  }

  // Emphasis markers cannot sit next to whitespace, so keep it outside them.
  const [, leading, inner, trailing] = node.text.match(/^(\s*)(.*?)(\s*)$/s);
  if (!inner) return node.text;
  let text = escapeText(inner);
  if (italic) text = `*${text}*`;
  if (bold) text = `**${text}**`;
  return `${leading}${text}${trailing}`;
}

function renderInline(children = [], context = {}) {
  // Merge adjacent text nodes with identical marks so "**a****b**" does not
  // appear when the editor split a run.
  const merged = [];
  for (const child of children) {
    const previous = merged[merged.length - 1];
    if (
      child.text !== undefined &&
      !child.type &&
      previous?.text !== undefined &&
      !previous.type &&
      sameMarks(previous, child)
    ) {
      merged[merged.length - 1] = {
        ...previous,
        text: previous.text + child.text,
      };
    } else {
      merged.push(child);
    }
  }

  return merged
    .map((child) => {
      if (child.type === 'link') {
        const label = renderInline(child.children, context).trim();
        const title = child.title
          ? ` "${child.title.replace(/"/g, '\\"')}"`
          : '';
        return `[${label || child.href}](${child.href}${title})`;
      }
      if (child.type === 'break') {
        return context.inTable ? ' ' : '\\\n';
      }
      if (child.type) {
        return renderInline(child.children, context);
      }
      return renderText(child);
    })
    .join('');
}

const LIST_TYPES = ['list', 'bulleted-list', 'numbered-list'];

// Flattens a list item into markdown blocks, in order. Items wrap their content
// in list-item-child or paragraph nodes, which may hold nested lists.
function listItemBlocks(nodes) {
  const blocks = [];
  let inline = [];
  const flush = () => {
    const text = renderInline(inline).trim();
    if (text) blocks.push(text);
    inline = [];
  };
  for (const node of nodes) {
    if (LIST_TYPES.includes(node.type)) {
      flush();
      blocks.push(renderBlock(node));
    } else if (node.type === 'list-item-child' || node.type === 'paragraph') {
      flush();
      blocks.push(...listItemBlocks(node.children ?? []));
    } else {
      inline.push(node);
    }
  }
  flush();
  return blocks;
}

function renderList(node, ordered) {
  let index = node.start ?? 1;
  return node.children
    .map((item) => {
      const marker = ordered ? `${index++}.` : '-';
      const indent = ' '.repeat(marker.length + 1);
      const blocks = listItemBlocks(item.children ?? []);
      const content = blocks
        .map((block, i) => {
          if (i === 0) return block;
          // Nested lists hug the line above; further paragraphs need a gap.
          const isList = /^(\d+\.|-) /.test(block);
          return `${isList ? '\n' : '\n\n'}${block}`;
        })
        .join('');
      // Continuation lines must be indented to stay inside the item.
      return `${marker} ${content.replace(/\n(?!\n)/g, `\n${indent}`)}`;
    })
    .join('\n');
}

function renderTable(node) {
  const rows = [];
  for (const section of node.children ?? []) {
    for (const row of section.children ?? []) {
      rows.push(
        (row.children ?? []).map((cell) =>
          renderInline(cell.children, { inTable: true })
            .replace(/\n/g, ' ')
            .replace(/\|/g, '\\|')
            .trim()
        )
      );
    }
  }
  if (!rows.length) return '';

  const width = Math.max(...rows.map((row) => row.length));
  const pad = (row) => [...row, ...Array(width - row.length).fill('')];
  const [header, ...body] = rows.map(pad);
  return [
    `| ${header.join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...body.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

function renderBlock(node) {
  switch (node.type) {
    case 'paragraph':
      // Paragraphs starting with "## " or "- " were pasted in as markdown, so
      // they are left unescaped and render as the headings and lists intended.
      return renderInline(node.children).trim();
    case 'heading-one':
    case 'heading-two':
    case 'heading-three':
    case 'heading-four':
    case 'heading-five':
    case 'heading-six': {
      const level =
        ['one', 'two', 'three', 'four', 'five', 'six'].indexOf(
          node.type.replace('heading-', '')
        ) + 1;
      return `${'#'.repeat(level)} ${renderInline(node.children).trim()}`;
    }
    case 'bulleted-list':
      return renderList(node, false);
    case 'numbered-list':
      return renderList(node, true);
    case 'list':
      return renderList(node, node.ordered);
    case 'block-quote':
    case 'blockquote': {
      const hasBlocks = (node.children ?? []).some((c) => c.type);
      const inner = hasBlocks
        ? node.children.map((c) => renderBlock(c)).join('\n\n')
        : renderInline(node.children).trim();
      return inner
        .split('\n')
        .map((line) => (line ? `> ${line}` : '>'))
        .join('\n');
    }
    case 'code-block':
    case 'code': {
      const text = (node.children ?? [])
        .map((c) => c.text ?? '')
        .join('')
        .replace(/\n$/, '');
      const lang = node.lang && node.lang !== 'text' ? node.lang : '';
      return `\`\`\`${lang}\n${text}\n\`\`\``;
    }
    case 'thematicBreak':
      return '---';
    case 'table':
      return renderTable(node);
    case 'image':
      return `![${node.title ?? ''}](${node.localPath})`;
    case 'iframe':
      // A bare YouTube URL on its own line is rendered as an embed.
      return node.url;
    case undefined:
      return renderText(node).trim();
    default:
      throw new Error(`Unsupported rich text node: ${node.type}`);
  }
}

async function downloadInlineImages(node, slug) {
  if (node.type === 'image') {
    const name = `${node.handle}.${extensionFor(node.mimeType, node.title)}`;
    node.localPath = await downloadImage(node.src, slug, name);
  }
  for (const child of node.children ?? []) {
    await downloadInlineImages(child, slug);
  }
}

function frontmatter(fields) {
  const lines = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
  return `---\n${lines.join('\n')}\n---`;
}

const posts = await fetchAllPosts();
await mkdir(path.join(outputDir, 'posts'), { recursive: true });

for (const post of posts) {
  await downloadInlineImages(post.content.raw, post.slug);

  const featuredImage = post.featuredImage
    ? await downloadImage(
        post.featuredImage.url,
        post.slug,
        `cover.${extensionFor(post.featuredImage.mimeType, post.featuredImage.fileName)}`
      )
    : undefined;

  const body = post.content.raw.children
    .map((node) => renderBlock(node))
    .filter(Boolean)
    .join('\n\n');

  const file = `${frontmatter({
    title: post.title,
    description: post.description,
    author: post.author,
    publishedAt: post.displayedPublishedAt,
    featuredImage,
  })}\n\n${body}\n`;

  await writeFile(path.join(outputDir, 'posts', `${post.slug}.md`), file);
  console.log(`Exported ${post.slug}`);
}

console.log(`\nExported ${posts.length} posts to ${path.resolve(outputDir)}`);
