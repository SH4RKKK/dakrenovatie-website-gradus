// Capture mobile + desktop full-page screenshots into a timestamped folder.
//
// Each run creates a fresh subfolder named with the date + time (one per
// iteration) so the visual history is preserved instead of overwritten.
//
// Usage:
//   node screenshot.mjs --url http://localhost:4321
//   node screenshot.mjs --url http://localhost:4321 --paths / /contact --label hero-tweak
//   node screenshot.mjs --url http://localhost:4321 --out testing-screenshots
//
// Requires: npm install -D playwright && npx playwright install chromium

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

// Read a flag and the (possibly multiple) values that follow it, up to the next --flag.
function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return fallback;
  const vals = [];
  for (let j = i + 1; j < process.argv.length && !process.argv[j].startsWith('--'); j++) {
    vals.push(process.argv[j]);
  }
  return vals.length ? vals : fallback;
}

const url = arg('--url', ['http://localhost:4321'])[0];
const paths = arg('--paths', ['/']);
const outBase = arg('--out', ['testing-screenshots'])[0];
const label = arg('--label', [''])[0];

// Timestamp safe for Windows folder names (no colons).
function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}

const folderName = label ? `${timestamp()}_${label}` : timestamp();
const outDir = join(outBase, folderName);
mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];

const browser = await chromium.launch();
try {
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    for (const path of paths) {
      const target = new URL(path, url).href;
      await page.goto(target, { waitUntil: 'networkidle' });
      const slug = path === '/' ? 'home' : path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
      const file = join(outDir, `${slug}__${vp.name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(`saved ${file}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(`\nScreenshots in: ${outDir}`);
