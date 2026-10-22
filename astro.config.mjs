// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

/**
 * Site base URL.
 *
 * Canonical URLs, the XML sitemap and robots.txt are all generated from this
 * single value. Set SITE_URL to the real production origin before deploying,
 * e.g.  SITE_URL=https://www.example.com npm run build
 *
 * Falls back to localhost for local development only.
 */
const site = process.env.SITE_URL || 'http://localhost:4321';

export default defineConfig({
  site,
  // Server rendering powers the admin dashboard and the live games library:
  // uploads made in /admin appear on /games/ immediately, no rebuild needed.
  // Editorial guide pages opt back into static rendering with `prerender = true`.
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  compressHTML: true,
  devToolbar: {
    enabled: false,
  },
});
