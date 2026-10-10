import type { APIRoute } from 'astro';
import { siteConfig } from '../config/site';

export const GET: APIRoute = () => new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap-index.xml', siteConfig.url)}`, {
  headers: { 'Content-Type': 'text/plain; charset=utf-8' },
});
