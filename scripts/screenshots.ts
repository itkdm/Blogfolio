import { promises as dns } from 'node:dns';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { chromium, request, type APIRequestContext } from 'playwright';
import sharp from 'sharp';

const root = process.cwd();
const outputDir = resolve(root, 'public/screenshots');
const proxyServer = process.env.BLOGFOLIO_SCREENSHOT_PROXY;
const renderWaitMs = Math.max(0, Number(process.env.BLOGFOLIO_SCREENSHOT_WAIT_MS ?? 10000));
const dnsQueryUrl = 'https://cloudflare-dns.com/dns-query';

function isPrivateAddress(address: string): boolean {
  const value = address.toLowerCase().split('%')[0];
  if (value.includes(':')) {
    const mapped = value.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
    if (mapped) return isPrivateAddress(mapped);
    return value === '::' || value === '::1' || value.startsWith('fe') || value.startsWith('fc') || value.startsWith('fd') || value.startsWith('ff') || value.startsWith('2001:db8') || !/^[23]/.test(value);
  }
  const ip = value;
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return false;
  const [a,b] = ip.split('.').map(Number);
  const [,, c] = ip.split('.').map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || (b === 0 && c === 0) || (b === 0 && c === 2) || (b === 88 && c === 99))) || (a === 198 && (b === 18 || b === 19 || b === 51 && c === 100)) || (a === 203 && b === 0 && c === 113);
}

const hostCache = new Map<string, Promise<void>>();
async function resolveThroughDoh(host: string, requestContext: APIRequestContext): Promise<string[]> {
  const answers = await Promise.all([1, 28].map(async (type) => {
    const query = new URL(dnsQueryUrl);
    query.searchParams.set('name', host);
    query.searchParams.set('type', String(type));
    const response = await requestContext.get(query.toString(), { headers: { accept: 'application/dns-json' }, timeout: 15000 });
    if (!response.ok()) throw new Error(`DNS-over-HTTPS query failed for ${host} (HTTP ${response.status()})`);
    const result = await response.json() as { Status?: number; Answer?: Array<{ type: number; data: string }> };
    if (result.Status !== 0) throw new Error(`DNS-over-HTTPS could not resolve ${host} (DNS status ${result.Status})`);
    return (result.Answer ?? []).filter((answer) => answer.type === type).map((answer) => answer.data);
  }));
  return [...new Set(answers.flat())];
}

async function assertPublicUrl(raw: string, requestContext: APIRequestContext): Promise<void> {
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Only public HTTP(S) URLs without credentials are allowed');
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('Local network hostnames are not allowed');
  const check = hostCache.get(host) || (async () => {
    const addresses = proxyServer
      ? (await resolveThroughDoh(host, requestContext)).map((address) => ({ address }))
      : await dns.lookup(host, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) throw new Error(`Host ${host} resolves to a private or reserved address`);
  })();
  hostCache.set(host, check);
  await check;
}

const contentDir = resolve(root, 'src/content/blogs');
const allBlogs = await Promise.all((await readdir(contentDir)).filter((name) => name.endsWith('.json')).map(async (name) => {
  const data = JSON.parse(await readFile(resolve(contentDir, name), 'utf8')) as { name: string; url: string; screenshot: string };
  return { id: name.replace(/\.json$/, ''), data };
}));
const requestedSlug = process.argv.find((arg) => arg.startsWith('--slug='))?.split('=')[1];
const blogs = requestedSlug ? allBlogs.filter((blog) => blog.id === requestedSlug) : allBlogs;
if (requestedSlug && !blogs.length) { console.error(`No blog found with slug: ${requestedSlug}`); process.exitCode = 1; }
await mkdir(outputDir, { recursive: true });
const proxy = proxyServer ? { server: proxyServer } : undefined;
const requestContext = await request.newContext(proxy ? { proxy } : {});
const browser = await chromium.launch({ headless: true, proxy });
let succeeded = 0;
let nextBlog = 0;
async function captureNext(): Promise<void> {
  while (nextBlog < blogs.length) {
    const blog = blogs[nextBlog++];
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    try {
      await assertPublicUrl(blog.data.url, requestContext);
      await page.route('**/*', async (route) => {
        try { await assertPublicUrl(route.request().url(), requestContext); await route.continue(); }
        catch (error) { console.warn(`[blocked request] ${route.request().url()}: ${(error as Error).message}`); await route.abort(); }
      });
      await page.goto(blog.data.url, { waitUntil: 'commit', timeout: 15000 });
      await page.waitForTimeout(renderWaitMs);
      const cdp = await context.newCDPSession(page);
      await cdp.send('Page.enable');
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
      const png = Buffer.from(data, 'base64');
      const file = resolve(outputDir, `${blog.id}.webp`);
      await sharp(png).resize({ width: 1440, height: 900, fit: 'cover' }).webp({ quality: 79, effort: 5 }).toFile(file);
      succeeded += 1;
      console.log(`[ok] ${blog.data.name} → ${file}`);
    } catch (error) {
      console.error(`[failed] ${blog.data.name} (${blog.data.url}): ${(error as Error).message}`);
    } finally { await context.close(); }
  }
}
await Promise.all(Array.from({ length: Math.min(4, blogs.length) }, () => captureNext()));
await browser.close();
await requestContext.dispose();
console.log(`Screenshots generated: ${succeeded}/${blogs.length}`);
