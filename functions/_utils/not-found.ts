import en from '../../src/i18n/translations/en';
import zhCN from '../../src/i18n/translations/zh-CN';

type ErrorLocale = 'en' | 'zh-CN';

const dictionaries = { en, 'zh-CN': zhCN };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[character];
  });
}

export function createNotFoundResponse(locale: ErrorLocale): Response {
  const dictionary = dictionaries[locale];
  const title = escapeHtml(dictionary['404.title']);
  const description = escapeHtml(dictionary['404.desc']);
  const backLabel = escapeHtml(dictionary['404.back']);
  const homePath = locale === 'zh-CN' ? '/zh/' : '/';
  const html = `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, follow" />
    <title>${title} — Blogfolio</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <style>
      :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: #242b25; background: #fafaf8; }
      * { box-sizing: border-box; }
      body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 24px; }
      main { width: min(100%, 640px); text-align: center; }
      .brand { display: inline-flex; align-items: center; gap: 10px; color: inherit; text-decoration: none; font-weight: 600; }
      .mark { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 50%; background: #304c39; color: #fff; font-family: Georgia, serif; }
      .code { margin: 64px 0 12px; color: #526c57; font: 12px ui-monospace, monospace; letter-spacing: .16em; }
      h1 { margin: 0 0 12px; font: 500 clamp(32px, 7vw, 48px)/1.15 Georgia, serif; letter-spacing: -.035em; }
      p { margin: 0 auto 28px; color: #71786f; line-height: 1.7; }
      .back { display: inline-flex; padding: 12px 18px; border-radius: 4px; background: #304c39; color: #fff; text-decoration: none; font-size: 14px; }
      .back:hover { background: #263d2e; }
    </style>
  </head>
  <body>
    <main>
      <a class="brand" href="${homePath}" aria-label="Blogfolio"><span class="mark">b.</span>Blogfolio</a>
      <div class="code">404</div>
      <h1>${title}</h1>
      <p>${description}</p>
      <a class="back" href="${homePath}">${backLabel}</a>
    </main>
  </body>
</html>`;

  return new Response(html, {
    status: 404,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, follow',
    },
  });
}
