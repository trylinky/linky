// Makes the blog content available to the marketing site. Posts live in a
// separate private repository (posts/*.md + images/), configured with:
//
// - BLOG_CONTENT_DIR: path to a local checkout of the content repo, relative to
//   apps/marketing. Its images are symlinked so new ones show up in dev.
// - BLOG_CONTENT_REPO ("owner/name") and BLOG_CONTENT_TOKEN: shallow clone the
//   repo into .blog-content. Used for deployments. The token only needs
//   read-only contents access to that one repository.
//
// With neither set, the site builds and runs without a blog.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, rmSync, symlinkSync } from 'node:fs';
import path from 'node:path';

const { BLOG_CONTENT_DIR, BLOG_CONTENT_REPO, BLOG_CONTENT_TOKEN, VERCEL_ENV } =
  process.env;

const CLONE_DIR = '.blog-content';
const PUBLIC_ASSETS_DIR = 'public/blog-assets';

rmSync(PUBLIC_ASSETS_DIR, { recursive: true, force: true });

if (BLOG_CONTENT_DIR) {
  const imagesDir = path.resolve(BLOG_CONTENT_DIR, 'images');
  if (!existsSync(path.resolve(BLOG_CONTENT_DIR, 'posts'))) {
    console.error(`BLOG_CONTENT_DIR has no posts/ folder: ${BLOG_CONTENT_DIR}`);
    process.exit(1);
  }
  if (existsSync(imagesDir)) symlinkSync(imagesDir, PUBLIC_ASSETS_DIR);
  console.log('Blog content: using local directory');
} else if (BLOG_CONTENT_REPO && BLOG_CONTENT_TOKEN) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(BLOG_CONTENT_REPO)) {
    console.error('BLOG_CONTENT_REPO must look like "owner/name"');
    process.exit(1);
  }

  rmSync(CLONE_DIR, { recursive: true, force: true });
  const auth = Buffer.from(`x-access-token:${BLOG_CONTENT_TOKEN}`).toString(
    'base64'
  );

  try {
    execFileSync(
      'git',
      [
        'clone',
        '--depth=1',
        '--quiet',
        `https://github.com/${BLOG_CONTENT_REPO}.git`,
        CLONE_DIR,
      ],
      {
        stdio: ['ignore', 'ignore', 'pipe'],
        // Passed through the environment so the token is not in the process
        // arguments or the remote URL.
        env: {
          ...process.env,
          GIT_TERMINAL_PROMPT: '0',
          GIT_CONFIG_COUNT: '1',
          GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
          GIT_CONFIG_VALUE_0: `Authorization: Basic ${auth}`,
        },
      }
    );
  } catch (error) {
    // The repository name is deliberately kept out of build logs.
    const stderr = String(error.stderr ?? '')
      .replaceAll(BLOG_CONTENT_REPO, '<BLOG_CONTENT_REPO>')
      .trim();
    console.error(`Blog content: failed to clone repository\n${stderr}`);
    process.exit(1);
  }

  const imagesDir = path.join(CLONE_DIR, 'images');
  if (existsSync(imagesDir)) {
    cpSync(imagesDir, PUBLIC_ASSETS_DIR, { recursive: true });
  }
  console.log('Blog content: cloned repository');
} else if (VERCEL_ENV === 'production') {
  // Don't let a missing env var silently ship a site without its blog.
  console.error(
    'Blog content is not configured: set BLOG_CONTENT_REPO and BLOG_CONTENT_TOKEN'
  );
  process.exit(1);
} else {
  console.log('Blog content: not configured, building without the blog');
}
