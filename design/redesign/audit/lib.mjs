// Shared helpers for the audit capture. See capture.mjs.
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
export const OUT = resolve(here, '../captures/audit');
export const AUTH = join(OUT, '.auth');
export const BASE = process.env.AUDIT_BASE ?? 'http://localhost:5173';
export const API_WS = process.env.AUDIT_WS ?? 'ws://localhost:8797';
export const SESSION = process.env.AUDIT_SESSION ?? '964a442a-80fe-4f07-9dd2-68bd47af6eae';

// playwright-core is a devDependency of design/redesign (npm install there).
// PLAYWRIGHT_CORE may point at another copy.
export function loadPlaywright() {
  const require = createRequire(import.meta.url);
  const candidates = [
    process.env.PLAYWRIGHT_CORE,
    'playwright-core',
  ].filter(Boolean);
  for (const c of candidates) {
    try { return require(c); } catch { /* next */ }
  }
  throw new Error('playwright-core not found; set PLAYWRIGHT_CORE');
}

export async function launch() {
  const { chromium } = loadPlaywright();
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  return chromium.launch({
    headless: true,
    executablePath: process.env.AUDIT_CHROME ?? (existsSync(chrome) ? chrome : undefined),
  });
}

// One dev login per role, ever: the cookie is kept in the gitignored output dir.
export async function roleContext(browser, role, opts = {}) {
  mkdirSync(AUTH, { recursive: true });
  const file = join(AUTH, `${role}.json`);
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...(existsSync(file) ? { storageState: file } : {}),
    ...opts,
  });
  if (!existsSync(file)) {
    const page = await ctx.newPage();
    await page.goto(`${BASE}/api/auth/dev-login?role=${role}&next=/app`);
    await page.waitForLoadState('domcontentloaded');
    await ctx.storageState({ path: file });
    await page.close();
  }
  return ctx;
}

export function setTheme(ctx, theme) {
  // addInitScript stacks, and the last one registered wins.
  return ctx.addInitScript((t) => {
    try { localStorage.setItem('anvil-theme', t); } catch { /* noop */ }
  }, theme);
}

const consoleLog = join(OUT, 'console.log');
export function watch(page, label) {
  const seen = new Map();
  page.on('console', (m) => {
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    const key = m.text().slice(0, 160);
    seen.set(key, (seen.get(key) ?? 0) + 1);
  });
  page.on('pageerror', (e) => {
    const key = `pageerror: ${e.message.slice(0, 160)}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  });
  return () => {
    for (const [k, n] of seen) appendFileSync(consoleLog, `${label}\t${n}\t${k.replace(/\s+/g, ' ')}\n`);
  };
}

export async function shot(page, name, { full = false } = {}) {
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: full, animations: 'disabled', timeout: 60000 });
  console.log('shot', name);
}

// Server socket as Director, using the app's own protocol (see HARNESS.md).
export async function directorSocket(page) {
  return page.evaluate(async ({ id, ws }) => {
    const me = await (await fetch('/api/auth/me')).json();
    const r = await fetch(`/api/sessions/${id}/ws-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': me.csrfToken },
      body: JSON.stringify({ clientKind: 'director' }),
    });
    const { token } = await r.json();
    const s = new WebSocket(`${ws}/api/sessions/${id}/ws?token=${token}`);
    window.__audit = { s, msgs: [] };
    s.onmessage = (e) => { try { window.__audit.msgs.push(JSON.parse(e.data)); } catch { /* */ } };
    await new Promise((res, rej) => { s.onopen = res; s.onerror = rej; });
    return true;
  }, { id: SESSION, ws: API_WS });
}

export function send(page, msg) {
  return page.evaluate((m) => window.__audit.s.send(JSON.stringify(m)), msg);
}
export { writeFileSync, join };
