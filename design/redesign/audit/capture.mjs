#!/usr/bin/env node
// Audit capture for the demo-led redesign. Repeatable: Task 18 reruns it.
//
//   PLAYWRIGHT_CORE=/path/to/playwright-core node design/redesign/audit/capture.mjs <phase...>
//
// Phases, in order (default: all except empty-live and verify, which are explicit): battle battle-detail battle-interact modes app
// workspaces extras public mobile states restore
// Needs the live harness from design/redesign/HARNESS.md running. Run `battle`
// first: a scene switch drops the six extra heroes of the dense fixture.
// Screenshots go to design/redesign/captures/audit/ (gitignored). Cookies from
// the one dev login per role are kept in .auth/ there. Set AUDIT_SESSION for a
// rebuilt harness (see lib.mjs).
import { launch, roleContext, setTheme, watch, shot, directorSocket, send, BASE, SESSION, OUT } from './lib.mjs';

const SIZES = [[1440, 900], [1280, 720]];
const THEMES = ['dark', 'light'];
const PHONE = { width: 375, height: 812 };
const ROLES = ['director', 'player'];

const browser = await launch();
const phases = process.argv.slice(2);
const want = (p) => phases.length === 0 || phases.includes(p);

// One context per role and theme, so the theme is really stored and loaded.
async function withContext(role, theme, size, fn) {
  const ctx = await roleContext(browser, role, { viewport: { width: size[0], height: size[1] } });
  await setTheme(ctx, theme);
  const page = await ctx.newPage();
  const done = watch(page, `${role}/${theme}/${size.join('x')}`);
  try {
    await fn(page, ctx);
  } finally {
    done();
    await ctx.close();
  }
}

async function open(page, path, settle = 2500) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(settle);
}

async function sessionGrid(mode, settle = 5000) {
  for (const role of ROLES) for (const theme of THEMES) for (const size of SIZES) {
    await withContext(role, theme, size, async (page) => {
      await open(page, `/app/session/${SESSION}`, settle);
      await shot(page, `session-${mode}-${role}-${size[0]}-${theme}`);
    });
  }
}

async function phoneAndDisplay(mode) {
  for (const role of ROLES) for (const theme of THEMES) {
    await withContext(role, theme, [PHONE.width, PHONE.height], async (page) => {
      await open(page, `/app/session/${SESSION}/phone`, 4000);
      await shot(page, `phone-${mode}-${role}-375-${theme}`);
    });
  }
  for (const theme of THEMES) for (const size of SIZES) {
    await withContext('director', theme, size, async (page) => {
      await open(page, `/app/session/${SESSION}/display`, 5000);
      await shot(page, `display-${mode}-${size[0]}-${theme}`);
    });
  }
}

async function fit(page) {
  // Not a real click: on the Player and Display the button sits below the
  // visible stage, and Playwright scrolling it into view shifts the whole layout.
  await page.evaluate(() => document.querySelector('[title="Fit to Map (Ctrl+0)"]').click());
  await page.waitForTimeout(1200);
}

// The rail tabs, in one theme per size so both sizes and both themes are covered.
const DETAIL = [['dark', SIZES[0]], ['light', SIZES[1]]];
async function railTabs(mode, role, labels) {
  for (const [theme, size] of DETAIL) {
    await withContext(role, theme, size, async (page) => {
      await open(page, `/app/session/${SESSION}`, 4500);
      for (const label of labels) {
        const tab = page.getByRole('tab', { name: new RegExp(`^${label}`, 'i') }).first();
        if (!(await tab.count())) { console.log('no tab', role, label); continue; }
        await tab.click({ force: true });
        await page.waitForTimeout(700);
        await shot(page, `session-${mode}-${role}-tab-${label.toLowerCase()}-${size[0]}-${theme}`);
      }
    });
  }
}

if (want('battle')) {
  await sessionGrid('battle');
  await phoneAndDisplay('battle');
}

if (want('battle-detail')) {
  const fitRoles = process.env.AUDIT_FIT_ROLES?.split(',') ?? ROLES;
  for (const role of fitRoles) for (const theme of THEMES) for (const size of SIZES) {
    await withContext(role, theme, size, async (page) => {
      await open(page, `/app/session/${SESSION}`, 4500);
      await fit(page);
      await shot(page, `session-battle-${role}-fit-${size[0]}-${theme}`);
    });
  }
  for (const theme of THEMES) for (const size of SIZES) {
    await withContext('director', theme, size, async (page) => {
      await open(page, `/app/session/${SESSION}/display`, 4500);
      await fit(page);
      await shot(page, `display-battle-fit-${size[0]}-${theme}`);
    });
  }
  if (process.env.AUDIT_FIT_ROLES) { await browser.close(); process.exit(0); }
  await railTabs('battle', 'director', ['Heroes', 'Log', 'Audio', 'Damage', 'Grid', 'Assets']);
  await railTabs('battle', 'player', ['Abilities', 'Turn', 'Combat', 'Log']);
}

// Token interactions and the Player's own turn. Pixel positions assume the dense
// fixture at 1440 x 900 after Fit. This changes the turn state, so
// it runs after the dense captures above and before any scene switch.
if (want('battle-interact')) {
  const size = SIZES[0];
  const crisp = await roleContext(browser, 'director', { viewport: { width: size[0], height: size[1] }, deviceScaleFactor: 2 });
  await setTheme(crisp, 'dark');
  const page = await crisp.newPage();
  await open(page, `/app/session/${SESSION}`, 4500);
  await fit(page);
  await page.screenshot({ path: `${OUT}/crop-battle-heroes-director-2x.png`, clip: { x: 500, y: 740, width: 200, height: 120 } });
  await page.screenshot({ path: `${OUT}/crop-battle-monsters-director-2x.png`, clip: { x: 420, y: 540, width: 400, height: 240 } });
  await page.mouse.move(968, 596);
  await page.waitForTimeout(900);
  await shot(page, 'session-battle-director-token-hover-1440-dark');
  await page.mouse.click(968, 558);
  await page.waitForTimeout(900);
  await shot(page, 'session-battle-director-token-selected-1440-dark');
  await page.mouse.click(968, 558, { button: 'right' });
  await page.waitForTimeout(700);
  await shot(page, 'session-battle-director-token-menu-1440-dark');
  await page.keyboard.press('Escape');

  await directorSocket(page);
  await send(page, { type: 'combat_action', action: { type: 'END_TURN' } });
  await page.waitForTimeout(1200);

  await withContext('player', 'dark', size, async (pl) => {
    await open(pl, `/app/session/${SESSION}`, 4500);
    await pl.getByRole('tab', { name: /^combat/i }).first().click({ force: true });
    await pl.waitForTimeout(600);
    await shot(pl, 'session-battle-player-can-claim-1440-dark');
    const claim = pl.getByRole('button', { name: 'Take My Turn' });
    if (await claim.count()) {
      await claim.click();
      await pl.waitForTimeout(1500);
      await shot(pl, 'session-battle-player-my-turn-combat-1440-dark');
      await pl.getByRole('tab', { name: /^turn/i }).first().click({ force: true });
      await pl.waitForTimeout(700);
      await shot(pl, 'session-battle-player-my-turn-1440-dark');
      await pl.setViewportSize({ width: 1280, height: 720 });
      await pl.waitForTimeout(800);
      await shot(pl, 'session-battle-player-my-turn-1280-dark');
    } else console.log('no claim button');
  });
  await page.waitForTimeout(500);
  await shot(page, 'session-battle-director-hero-acting-1440-dark');
  await crisp.close();
}

// Every tab the page offers, found at run time because they change per mode.
async function allTabs(mode, role) {
  await withContext(role, 'dark', SIZES[0], async (page) => {
    await open(page, `/app/session/${SESSION}`, 4000);
    const tabs = page.getByRole('tab');
    const n = await tabs.count();
    for (let i = 0; i < n; i += 1) {
      const tab = tabs.nth(i);
      const label = ((await tab.textContent()) ?? `tab${i}`).trim().toLowerCase().replace(/[^a-z]+/g, '') || `tab${i}`;
      await tab.click({ force: true });
      await page.waitForTimeout(600);
      await shot(page, `session-${mode}-${role}-tab-${label}-1440-dark`);
    }
  });
}

async function withSocket(fn) {
  const ctx = await roleContext(browser, 'director');
  const page = await ctx.newPage();
  await open(page, '/app', 1000);
  await directorSocket(page);
  const { scenes } = await page.evaluate(async (id) => (await fetch(`/api/sessions/${id}/scenes`)).json(), SESSION);
  await fn(page, scenes);
  await page.waitForTimeout(800);
  await ctx.close();
}

if (want('modes')) {
  for (const mode of ['story', 'montage', 'negotiation', 'respite']) {
    await withSocket(async (page, scenes) => {
      const scene = scenes.find((s) => s.type === mode);
      await send(page, { type: 'switch_scene', sceneId: scene.id });
      await page.waitForTimeout(2500);
    });
    await sessionGrid(mode, 3500);
    await phoneAndDisplay(mode);
    await allTabs(mode, 'director');
    await allTabs(mode, 'player');
  }
}

// IDs from the 2026-11-07 harness. A rebuilt harness gets new ones: set these.
const HERO = process.env.AUDIT_HERO ?? '65f91b0f-3d4d-4f5a-b75f-16a5655b23df';
const CAMPAIGN = process.env.AUDIT_CAMPAIGN ?? 'c4ae78b0-f3cf-488e-b44c-49518561dc66';

if (want('app')) {
  const routes = [
    ['home', '/app'], ['live', '/app/live'], ['campaigns', '/app/campaigns'],
    ['campaign', `/app/campaigns/${CAMPAIGN}`], ['heroes', '/app/heroes'], ['hero-new', '/app/heroes/new'],
    ['hero-sheet', `/app/heroes/${HERO}`], ['assets', '/app/assets'], ['notes', '/app/notes'],
    ['account', '/app/account'], ['join', '/app/join'], ['lobby', `/app/session/${SESSION}/lobby`],
  ];
  for (const role of ROLES) for (const theme of THEMES) for (const size of SIZES) {
    await withContext(role, theme, size, async (page) => {
      for (const [name, path] of routes) {
        await open(page, path, 2200);
        await shot(page, `app-${name}-${role}-${size[0]}-${theme}`);
      }
    });
  }
}

// The five scene workspaces inside the campaign builder. Scenes sit under the
// session node in the Structure tree, so open that first. Battle goes last: it
// swaps the left rail to Initiative, which hides the tree.
if (want('workspaces')) {
  for (const theme of THEMES) for (const size of SIZES) {
    await withContext('director', theme, size, async (page) => {
      await open(page, `/app/campaigns/${CAMPAIGN}`, 3000);
      await page.getByText('Smoke Live Session').first().click();
      await page.waitForTimeout(1500);
      if (theme === 'dark' && size[0] === 1440) await shot(page, 'app-campaign-tree-open-1440-dark');
      for (const [mode, re] of [['story', /Smoke Story/], ['montage', /Chase/], ['negotiation', /Negotiation/], ['respite', /Smoke Respite/], ['battle', /Get the Sword/]]) {
        const hit = page.getByText(re).first();
        if (!(await hit.count())) { console.log('no scene', mode); continue; }
        await hit.click();
        await page.waitForTimeout(2000);
        await shot(page, `app-workspace-${mode}-${size[0]}-${theme}`);
      }
    });
  }
}

// Screens a first visit or a live session hides. Lobby redirects when the session
// is active, so the session status is rewritten in the browser only.
if (want('extras')) {
  for (const role of ROLES) for (const theme of THEMES) for (const size of SIZES) {
    const tag = `${role}-${size[0]}-${theme}`;
    await withContext(role, theme, size, async (page, ctx) => {
      await open(page, '/app', 2500);
      const skip = page.getByRole('button', { name: /explore/i });
      if (await skip.count()) { await skip.click(); await page.waitForTimeout(1200); }
      await shot(page, `app-home-dismissed-${tag}`);
      await ctx.route(new RegExp(`/api/sessions/${SESSION}$`), async (route) => {
        const res = await route.fetch();
        const body = await res.json();
        body.session.status = 'lobby';
        await route.fulfill({ response: res, json: body });
      });
      await open(page, `/app/session/${SESSION}/lobby`, 3000);
      console.log('lobby url', page.url());
      await shot(page, `app-lobby-forced-${tag}`);
    });
  }
}

if (want('public')) {
  const token = await (async () => {
    const ctx = await roleContext(browser, 'director');
    const page = await ctx.newPage();
    await open(page, '/app', 800);
    const t = await page.evaluate(async (id) => {
      const me = await (await fetch('/api/auth/me')).json();
      const r = await fetch(`/api/campaigns/${id}/invites`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': me.csrfToken }, body: '{}',
      });
      return (await r.json()).token ?? null;
    }, CAMPAIGN);
    await ctx.close();
    return t;
  })();
  console.log('invite', token ? 'created' : 'failed');
  for (const theme of THEMES) for (const size of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: size[0], height: size[1] } });
    await setTheme(ctx, theme);
    const page = await ctx.newPage();
    const done = watch(page, `anon/${theme}/${size.join('x')}`);
    for (const [name, path] of [['landing', '/'], ['about', '/about'], ['contact', '/contact'], ['auth', '/auth']]) {
      await open(page, path, 2000);
      await shot(page, `public-${name}-${size[0]}-${theme}`);
      if (size[0] === 1440) await shot(page, `public-${name}-full-${size[0]}-${theme}`, { full: true });
    }
    if (token) {
      await open(page, `/join/${token}`, 2000);
      await shot(page, `public-join-anon-${size[0]}-${theme}`);
    }
    done();
    await ctx.close();
    await withContext('player', theme, size, async (pg) => {
      if (token) { await open(pg, `/join/${token}`, 2000); await shot(pg, `public-join-token-${size[0]}-${theme}`); }
      await open(pg, '/join/not-a-real-token', 2000);
      await shot(pg, `public-join-badtoken-${size[0]}-${theme}`);
    });
  }
}

if (want('mobile')) {
  const routes = [
    ['home', '/app/mobile'], ['heroes', '/app/mobile/heroes'], ['hero-new', '/app/mobile/heroes/new'],
    ['hero', `/app/mobile/heroes/${HERO}`], ['notes', '/app/mobile/notes'], ['assets', '/app/mobile/assets'],
    ['campaigns', '/app/mobile/campaigns'], ['account', '/app/mobile/account'],
  ];
  for (const role of ROLES) for (const theme of THEMES) {
    const ctx = await roleContext(browser, role, { viewport: PHONE, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await setTheme(ctx, theme);
    const page = await ctx.newPage();
    const done = watch(page, `${role}/${theme}/mobile`);
    for (const [name, path] of routes) {
      await open(page, path, 1800);
      await shot(page, `mobile-${name}-${role}-${theme}`);
    }
    done();
    await ctx.close();
  }
}

// Forced states. Everything is blocked in the browser context; no server is touched.
if (want('states')) {
  const never = () => new Promise(() => {});
  for (const theme of THEMES) for (const size of SIZES) {
    const tag = `${size[0]}-${theme}`;
    // Reconnect: let the socket connect, then cut it and refuse new ones.
    await withContext('player', theme, size, async (page, ctx) => {
      let cut = false;
      await ctx.routeWebSocket(/\/ws\?/, (ws) => {
        if (cut) { ws.close(); return; }
        ws.connectToServer();
        setTimeout(() => { cut = true; ws.close({ code: 4000, reason: 'audit' }); }, 4000);
      });
      await open(page, `/app/session/${SESSION}`, 6500);
      await shot(page, `state-reconnect-player-${tag}`);
    });
    // Skeletons: hold the request that ends the loading state.
    await withContext('director', theme, size, async (page, ctx) => {
      await ctx.route('**/ws-token', never);
      await open(page, `/app/session/${SESSION}`, 2500);
      await shot(page, `state-loading-session-${tag}`);
    });
    await withContext('director', theme, size, async (page, ctx) => {
      await ctx.route('**/api/campaigns*', never);
      await ctx.route('**/api/assets*', never);
      await ctx.route('**/api/heroes*', never);
      for (const [n, p] of [['home', '/app'], ['campaigns', '/app/campaigns'], ['assets', '/app/assets'], ['heroes', '/app/heroes']]) {
        await open(page, p, 2000);
        await shot(page, `state-loading-${n}-${tag}`);
      }
    });
    await withContext('director', theme, size, async (page, ctx) => {
      await ctx.route(/src\/pages\/About/, never);
      await open(page, '/about', 2000);
      await shot(page, `state-loading-route-chunk-${tag}`);
    });
    // Empty lists: real server shape, no rows.
    await withContext('director', theme, size, async (page, ctx) => {
      const json = (body) => (route) => route.fulfill({ json: body });
      await ctx.route(/\/api\/campaigns(\?.*)?$/, json({ directed: [], joined: [] }));
      await ctx.route(/\/api\/heroes(\?.*)?$/, json([]));
      await ctx.route(/\/api\/game-sessions(\?.*)?$/, json({ campaigns: [] }));
      for (const [n, p] of [['home', '/app'], ['live', '/app/live'], ['campaigns', '/app/campaigns'], ['heroes', '/app/heroes'], ['assets', '/app/assets'], ['notes', '/app/notes']]) {
        await open(page, p, 2000);
        await shot(page, `state-empty-${n}-${tag}`);
      }
    });
    // Errors.
    await withContext('director', theme, size, async (page, ctx) => {
      await open(page, '/this-route-does-not-exist', 2000);
      await shot(page, `state-badroute-${tag}`);
      console.log('bad route landed on', page.url());
      await open(page, '/app/session/not-a-session', 3000);
      await shot(page, `state-badsession-${tag}`);
      await open(page, '/app/campaigns/not-a-campaign', 2500);
      await shot(page, `state-badcampaign-${tag}`);
      await open(page, '/app/heroes/not-a-hero', 2500);
      await shot(page, `state-badhero-${tag}`);
      await ctx.route(/src\/pages\/Contact/, (r) => r.abort());
      await open(page, '/contact', 4000);
      await shot(page, `state-routeerror-chunk-${tag}`);
    });
    // Phone without a desktop anchor.
    await withContext('player', theme, [PHONE.width, PHONE.height], async (page, ctx) => {
      await ctx.routeWebSocket(/\/ws\?/, (ws) => {
        ws.onMessage(() => {});
        ws.send(JSON.stringify({ type: 'phone_anchor_status', anchored: false }));
      });
      await open(page, `/app/session/${SESSION}/phone`, 2500);
      await shot(page, `state-phone-locked-${theme}`);
    });
  }
}

// Rerun of one state on its own, for when only the Live list needs refreshing.
if (phases.includes('empty-live')) {
  for (const theme of THEMES) for (const size of SIZES) {
    await withContext('director', theme, size, async (page, ctx) => {
      await ctx.route(/\/api\/game-sessions(\?.*)?$/, (r) => r.fulfill({ json: { campaigns: [] } }));
      await open(page, '/app/live', 2000);
      await shot(page, `state-empty-live-${size[0]}-${theme}`);
    });
  }
}

// Final proof of the end state, and the doubled fog zone count.
if (phases.includes('verify')) {
  await withContext('director', 'dark', SIZES[0], async (page) => {
    await open(page, `/app/session/${SESSION}`, 4500);
    await fit(page);
    await shot(page, 'session-battle-final-director-fit-1440-dark');
    await page.getByRole('button', { name: /^fog$/i }).first().click();
    await page.waitForTimeout(900);
    await shot(page, 'session-battle-director-fog-tool-1440-dark');
    const zones = await page.getByText(/\d+ zones?/).first().textContent().catch(() => 'no zone text');
    console.log('fog text:', zones);
  });
}

if (want('restore')) {
  await withSocket(async (page, scenes) => {
    const scene = scenes.find((s) => s.type === 'battle');
    await send(page, { type: 'switch_scene', sceneId: scene.id });
    await page.waitForTimeout(2500);
    const s = await page.evaluate(async (id) => (await fetch(`/api/sessions/${id}`)).json(), SESSION);
    console.log('active scene', s.session.active_scene_id, s.session.active_scene_id === scene.id ? 'battle' : 'NOT battle');
  });
  await withContext('director', 'dark', SIZES[0], async (page) => {
    await open(page, `/app/session/${SESSION}`, 4000);
    await shot(page, 'session-battle-after-restore-director-1440-dark');
  });
}

await browser.close();
