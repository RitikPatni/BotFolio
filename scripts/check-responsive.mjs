import { chromium } from '/root/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/lib/index.js';

const BASE = 'http://127.0.0.1:4321';
const viewports = [
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'small-tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 }
];
const paths = ['/', '/blog', '/newsletter', '/library', '/photography', '/contact'];

const browser = await chromium.launch({ headless: true });
const failures = [];

for (const vp of viewports) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();

  for (const path of paths) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    const result = await page.evaluate(() => {
      const root = document.documentElement;
      const offenders = [];
      for (const el of document.querySelectorAll('body *')) {
        const rect = el.getBoundingClientRect();
        if (rect.width > root.clientWidth + 1 || rect.left < -1 || rect.right > root.clientWidth + 1) {
          offenders.push({
            tag: el.tagName.toLowerCase(),
            className: el.className || '',
            id: el.id || '',
            width: Number(rect.width.toFixed(1)),
            left: Number(rect.left.toFixed(1)),
            right: Number(rect.right.toFixed(1))
          });
          if (offenders.length >= 8) break;
        }
      }
      return {
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        hasOverflow: root.scrollWidth > root.clientWidth + 1,
        offenders
      };
    });
    if (result.hasOverflow || result.offenders.length) {
      failures.push({ viewport: vp.name, path, ...result });
    }
  }

  await context.close();
}

await browser.close();

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: viewports.length * paths.length }, null, 2));
