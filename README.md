# Blogfolio

Blogfolio is an editorial gallery of personal websites. It is a static Astro site: content lives in validated JSON collections, pages are generated at build time, and the small client script only powers search, category filtering, and pagination.

## Requirements

- Node.js 22.12 or newer
- pnpm 10 or newer
- Playwright Chromium only when generating screenshots

## Start locally

```bash
pnpm install
pnpm astro dev --background
```

Open the local URL printed by Astro (normally `http://localhost:4321`). Set `SITE_URL` to the production origin before building to generate the correct canonical links and sitemap. The fallback `https://blogfolio.example` is intentionally a placeholder.

```powershell
$env:SITE_URL = 'https://your-domain.example'
pnpm build
```

## Pages and features

- `/` discovery gallery with Fuse.js search, category filters, and a load-more button
- Website cards open the original websites in a new tab
- `/categories/<slug>` indexable category collections
- `/featured`, `/about`, and `/submit`
- English is served at the root paths; Simplified Chinese is available under `/zh/` for every page
- Locale dictionaries live in `src/i18n/translations`; shared route helpers and locale types live in `src/i18n/`
- Language links preserve the current route and URL query parameters
- Responsive navigation and screenshot fallback cards
- Page-specific metadata, canonical URLs, Open Graph, JSON-LD, `robots.txt`, and generated sitemap

## Add or edit a website

Add one JSON file under `src/content/blogs/`. Its filename becomes the URL slug. Astro validates each record against `src/content.config.ts` during build.

```json
{
  "name": "Example Blog",
  "url": "https://example.com",
  "screenshot": "/screenshots/example-blog.webp",
  "categories": ["writing", "minimal"],
  "tags": ["essays", "personal-web"],
  "featured": false,
  "addedAt": "2026-04-01"
}
```

Use stable category slugs from `src/config/site.ts` and tag slugs matching the keys in the translation dictionaries. Blog names, URLs, screenshots, and added dates remain shared across languages; category and tag labels are localized by the UI. Add UI text to both translation dictionaries; English is the typed source of translation keys, and `missingTranslationKeys('zh-CN')` reports untranslated entries.

## Website screenshots

Install the browser once, then generate all screenshots:

```bash
pnpm screenshots:install
pnpm screenshots
```

Generate one site's screenshot with `pnpm screenshots -- --slug=example-blog`. The script captures a 1440 × 900 viewport, converts it to WebP with Sharp, and writes it to `public/screenshots/`. Screenshot errors are reported per site without stopping the batch. It only visits HTTP(S) addresses that resolve to public IPs and checks each request, including redirects. Screenshots are editorial assets and are not regenerated during Astro builds.

The screenshot script accepts `BLOGFOLIO_SCREENSHOT_PROXY` for a local HTTP proxy and `BLOGFOLIO_SCREENSHOT_WAIT_MS` to adjust the render wait (default: 10000 ms). In proxy mode, target addresses are checked through DNS-over-HTTPS before navigation.

## Website recommendations

The `/submit` page embeds a Google Form. Update `recommendationFormUrl` in `src/config/site.ts` to use a different public form. The same form is available from the English and Simplified Chinese pages; form questions and responses are managed in Google Forms.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm astro dev --background` | Start local development |
| `pnpm check` | Run Astro and TypeScript diagnostics |
| `pnpm build` | Generate the static site in `dist/` |
| `pnpm preview` | Preview the production build |
| `pnpm screenshots` | Generate all approved website screenshots |
| `pnpm screenshots -- --slug=<slug>` | Generate one screenshot |
