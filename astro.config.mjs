// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://blogfolio.example',
  i18n: { locales: ['en', { path: 'zh', codes: ['zh-CN'] }], defaultLocale: 'en', routing: { prefixDefaultLocale: false } },
  integrations: [sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', zh: 'zh-CN' } } })],
  devToolbar: { enabled: false },
  vite: { plugins: [tailwindcss()] },
});
