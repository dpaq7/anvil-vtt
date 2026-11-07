#!/usr/bin/env node
// Measures what screenshots cannot show. Run with the live harness up:
//   PLAYWRIGHT_CORE=... node design/redesign/audit/a11y-probe.mjs
// Writes design/redesign/captures/audit/a11y.json (gitignored).
import { writeFileSync } from 'node:fs';
import { launch, roleContext, setTheme, BASE, SESSION, OUT } from './lib.mjs';

const measure = () => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const name = (e) => (e.getAttribute('aria-label') || e.getAttribute('title') || e.textContent || e.getAttribute('placeholder') || '').trim();
  const ctrls = [...document.querySelectorAll('button,a[href],input,select,textarea,[role=button],[role=tab],[role=slider]')].filter(vis);
  const unnamed = ctrls.filter((e) => !name(e) && !(e.labels && e.labels.length));
  const small = ctrls.filter((e) => { const r = e.getBoundingClientRect(); return r.width < 24 || r.height < 24; });
  const under44 = ctrls.filter((e) => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44; });
  const inputsNoLabel = [...document.querySelectorAll('input,select,textarea')].filter(vis).filter((e) => !(e.labels && e.labels.length) && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby'));
  const textEls = [...document.querySelectorAll('body *')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  const sizes = {};
  for (const e of textEls) { const f = Math.round(parseFloat(getComputedStyle(e).fontSize)); sizes[f] = (sizes[f] || 0) + 1; }
  const clipped = textEls.filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible').map((e) => e.textContent.trim().slice(0, 40));
  return {
    controls: ctrls.length, unnamed: unnamed.length, unnamedSample: unnamed.slice(0, 6).map((e) => e.outerHTML.slice(0, 110)),
    under24: small.length, under44: under44.length,
    inputsNoLabel: inputsNoLabel.length, inputSample: inputsNoLabel.slice(0, 4).map((e) => e.outerHTML.slice(0, 110)),
    landmarks: { main: document.querySelectorAll('main,[role=main]').length, nav: document.querySelectorAll('nav,[role=navigation]').length, h1: document.querySelectorAll('h1').length, headings: document.querySelectorAll('h1,h2,h3,h4').length },
    live: document.querySelectorAll('[aria-live],[role=status],[role=alert],[role=log]').length,
    canvases: [...document.querySelectorAll('canvas')].filter(vis).map((c) => ({ w: c.width, cssW: Math.round(c.getBoundingClientRect().width), aria: c.getAttribute('aria-label'), role: c.getAttribute('role'), tabindex: c.getAttribute('tabindex') })),
    fontPx: sizes, truncatedCount: clipped.length, truncated: clipped.slice(0, 12),
    bodyScroll: [document.documentElement.scrollWidth, innerWidth],
    lang: document.documentElement.lang,
  };
};

async function tabWalk(page, n = 30) {
  const seen = [];
  for (let i = 0; i < n; i += 1) {
    await page.keyboard.press('Tab');
    seen.push(await page.evaluate(() => {
      const e = document.activeElement; if (!e || e === document.body) return { el: 'body' };
      const s = getComputedStyle(e); const r = e.getBoundingClientRect();
      return { el: e.tagName, name: (e.getAttribute('aria-label') || e.textContent || e.getAttribute('title') || '').trim().slice(0, 30), ring: s.outlineStyle !== 'none' && s.outlineWidth !== '0px' || s.boxShadow !== 'none', onscreen: r.bottom <= innerHeight && r.right <= innerWidth && r.top >= 0 && r.left >= 0 };
    }));
  }
  return seen;
}

const browser = await launch();
const out = {};
const pages = [
  ['director', 'session', `/app/session/${SESSION}`, { width: 1440, height: 900 }],
  ['player', 'session', `/app/session/${SESSION}`, { width: 1440, height: 900 }],
  ['player', 'phone', `/app/session/${SESSION}/phone`, { width: 375, height: 812 }],
  ['director', 'phone', `/app/session/${SESSION}/phone`, { width: 375, height: 812 }],
  ['player', 'mobile-home', '/app/mobile', { width: 375, height: 812 }],
  ['director', 'campaigns', '/app/campaigns', { width: 1440, height: 900 }],
  ['player', 'hero-sheet', '/app/heroes/65f91b0f-3d4d-4f5a-b75f-16a5655b23df', { width: 1440, height: 900 }],
  ['player', 'home', '/app', { width: 1440, height: 900 }],
];
for (const [role, name, path, viewport] of pages) {
  const ctx = await roleContext(browser, role, { viewport });
  await setTheme(ctx, 'dark');
  const page = await ctx.newPage();
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  const m = await page.evaluate(measure);
  const walk = await tabWalk(page);
  out[`${role}/${name}`] = { ...m, tabStops: walk.length, noRing: walk.filter((w) => w.el !== 'body' && !w.ring).length, offscreen: walk.filter((w) => w.el !== 'body' && !w.onscreen).length, firstStops: walk.slice(0, 10).map((w) => w.name || w.el) };
  await ctx.close();
}
await browser.close();
writeFileSync(`${OUT}/a11y.json`, JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(out)) console.log(k, JSON.stringify({ c: v.controls, un: v.unnamed, u24: v.under24, u44: v.under44, inp: v.inputsNoLabel, lm: v.landmarks, live: v.live, cv: v.canvases, font: v.fontPx, tr: v.truncatedCount, noRing: v.noRing, off: v.offscreen }));
