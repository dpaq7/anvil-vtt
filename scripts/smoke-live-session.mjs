#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const DEFAULT_API_BASE = 'http://localhost:8787';
const DEFAULT_LOCAL_API_BASE = 'http://localhost:8797';
const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:5173';
const HEALTH_TIMEOUT_MS = 45_000;
const HEALTH_REQUEST_TIMEOUT_MS = 1_500;
const API_REQUEST_TIMEOUT_MS = 10_000;
const MESSAGE_TIMEOUT_MS = 8_000;

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const shouldStartServer = args.has('--start-server');
const apiBase = stripTrailingSlash(
  process.env['ANVIL_API_BASE'] ?? (shouldStartServer ? DEFAULT_LOCAL_API_BASE : DEFAULT_API_BASE),
);
const frontendOrigin = stripTrailingSlash(process.env['ANVIL_FRONTEND_ORIGIN'] ?? DEFAULT_FRONTEND_ORIGIN);
const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const smokeHome = process.env['ANVIL_SMOKE_HOME'] ?? '/private/tmp/anvil-vtt-smoke-home';
const smokeWranglerState = process.env['ANVIL_SMOKE_WRANGLER_STATE'] ?? `${smokeHome}/wrangler-state-${process.pid}`;
const holdOpenMs = Math.max(
  0,
  Number.parseInt(process.env['ANVIL_SMOKE_HOLD_MS'] ?? argValue('--hold-ms') ?? '0', 10) || 0,
);
const shouldHoldOpen = args.has('--hold-open') || holdOpenMs > 0;
const holdOpenDurationMs = holdOpenMs > 0 ? holdOpenMs : 300_000;

if (typeof WebSocket !== 'function') {
  throw new Error('This smoke test requires a Node runtime with the global WebSocket client available.');
}

const FALLBACK_DEMO_BATTLE_SCENE = {
  sourcePdf: 'Race to the Sword.pdf',
  directorSheet: 'Race to the Sword Director Sheet.pdf',
  encounterMap: 'Enchanted Forest Map by Nick DeSpain',
  mapUrl: '/demo-scenes/race-to-the-sword-003.jpg',
  gridCols: 17,
  gridRows: 22,
  gridCellSize: 149,
  gridType: 'square',
  gridOpacity: 0,
  gridColor: '#444444',
  difficulty: 'standard',
  heroStart: { x: 4, y: 19, width: 3, height: 2 },
  tokens: [
    {
      id: 'rts-smoke-radenwight-1',
      name: 'Radenwight Scout',
      monsterName: 'Radenwight',
      type: 'monster',
      x: 8,
      y: 7,
      size: 1,
      maxStamina: 12,
      currentStamina: 12,
      roles: ['ambusher'],
      notes: 'Smoke-test stand-in from the Race to the Sword demo battle.',
    },
  ],
  terrain: [
    {
      id: 'rts-smoke-muddy-water',
      terrainId: 'terrain-difficult',
      name: 'Muddy Water',
      x: 4,
      y: 4,
      w: 4,
      h: 5,
      color: 0x3b82f6,
    },
    {
      id: 'rts-smoke-sword-rift',
      terrainId: 'terrain-relic',
      name: 'Old Sword and Sealed Rift',
      x: 7,
      y: 5,
      w: 2,
      h: 2,
      color: 0xa855f7,
    },
  ],
  notes: [
    'Objective: leave the map with the sword for 1 Victory each.',
    'Muddy water is difficult terrain.',
    'Smoke fixture uses the Race to the Sword demo battle shape with a reduced token set.',
  ].join('\n\n'),
  successCondition: 'The heroes leave the encounter map with the sword.',
  failureCondition: 'The radenwights escape with the sword, the heroes are killed, or the heroes flee.',
};

const FALLBACK_MONTAGE_SCENE = {
  goal: 'Cross a dangerous swamp trail before the quarry escapes.',
  difficulty: 'moderate',
  successesNeeded: 2,
  failureLimit: 2,
  challenges: [
    {
      id: 'smoke-swamp-path',
      name: 'Find the Trail',
      description: 'Pick out safe ground through hidden pools and choking vines.',
      suggestedSkills: ['Navigate', 'Survival'],
    },
  ],
  notes: 'Compact montage fixture for the live-session smoke test.',
};

const FALLBACK_NEGOTIATION_SCENE = {
  template: {
    npc: {
      name: 'Volkir the Swipe',
      description: 'A wary informant who needs proof the heroes can protect her.',
    },
    startingAttitude: 'unfriendly',
    startingInterest: 2,
    startingPatience: 3,
    motivations: [
      {
        id: 'smoke-volkir-protection',
        type: 'protection',
        description: 'Volkir needs safety before she talks.',
        revealed: false,
      },
    ],
    pitfalls: [
      {
        id: 'smoke-volkir-greed',
        type: 'greed',
        description: 'Coin makes Volkir suspicious.',
        revealed: false,
      },
    ],
  },
  notes: 'Compact negotiation fixture for the live-session smoke test.',
};

const FALLBACK_STORY_SCENE = {
  readAloud: 'The trail opens into a moonlit clearing. Somewhere ahead, steel rings against stone.',
  directorNotes: 'Smoke-test story beat used to verify live read-aloud sync.',
};

const FALLBACK_RESPITE_SCENE = {
  availableActivities: ['recover', 'research'],
  notes: 'Compact respite fixture for the live-session smoke test.',
};

class ApiClient {
  constructor(name, role) {
    this.name = name;
    this.role = role;
    this.cookies = new Map();
    this.csrfToken = '';
    this.user = null;
  }

  async login() {
    await this.request(`/api/auth/dev-login?role=${this.role}`, {
      expectRedirect: true,
    });
    const me = await this.request('/api/auth/me');
    this.user = me.user;
    this.csrfToken = me.csrfToken;
    assert(this.user?.id, `${this.name} login did not return a user`);
    assert(this.csrfToken, `${this.name} login did not return a CSRF token`);
  }

  async request(path, options = {}) {
    const method = (options.method ?? 'GET').toUpperCase();
    const headers = new Headers(options.headers ?? {});
    headers.set('Accept', 'application/json');

    if (options.body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const cookie = this.cookieHeader();
    if (cookie) headers.set('Cookie', cookie);

    if (!SAFE_METHODS.has(method)) {
      headers.set('Origin', frontendOrigin);
      if (this.csrfToken) headers.set('X-CSRF-Token', this.csrfToken);
    }

    const res = await fetchWithTimeout(`${apiBase}${path}`, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      redirect: 'manual',
    }, API_REQUEST_TIMEOUT_MS);

    this.storeCookies(res.headers);

    if (options.expectRedirect) {
      assert(
        res.status >= 300 && res.status < 400,
        `${this.name} expected redirect from ${method} ${path}, got ${res.status}: ${await safeText(res)}`,
      );
      return null;
    }

    if (!res.ok) {
      throw new Error(`${this.name} ${method} ${path} failed with ${res.status}: ${await safeText(res)}`);
    }

    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  cookieHeader() {
    return Array.from(this.cookies.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }

  storeCookies(headers) {
    const setCookies = getSetCookies(headers);
    for (const cookie of setCookies) {
      const [pair] = cookie.split(';');
      if (!pair) continue;
      const separator = pair.indexOf('=');
      if (separator === -1) continue;
      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      if (!name) continue;
      if (cookie.toLowerCase().includes('max-age=0')) {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }
}

class SessionSocket {
  constructor(label, url) {
    this.label = label;
    this.url = url;
    this.messages = [];
    this.waiters = [];
    this.ws = null;
  }

  async connect() {
    this.ws = new WebSocket(this.url);
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      this.messages.push(message);
      this.resolveWaiters(message);
    });
    this.ws.addEventListener('close', () => {
      this.rejectWaiters(new Error(`${this.label} WebSocket closed`));
    });
    this.ws.addEventListener('error', () => {
      this.rejectWaiters(new Error(`${this.label} WebSocket errored`));
    });

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${this.label} WebSocket did not open`)), MESSAGE_TIMEOUT_MS);
      this.ws.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      this.ws.addEventListener('error', () => {
        clearTimeout(timer);
        reject(new Error(`${this.label} WebSocket failed to open`));
      }, { once: true });
    });
  }

  send(message) {
    assert(this.ws?.readyState === WebSocket.OPEN, `${this.label} WebSocket is not open`);
    this.ws.send(JSON.stringify(message));
  }

  waitFor(predicate, label, timeoutMs = MESSAGE_TIMEOUT_MS) {
    const existing = this.messages.find(predicate);
    if (existing) return Promise.resolve(existing);

    return new Promise((resolve, reject) => {
      const waiter = {
        predicate,
        resolve,
        reject,
        timer: setTimeout(() => {
          this.waiters = this.waiters.filter((item) => item !== waiter);
          reject(new Error(`${this.label} timed out waiting for ${label}`));
        }, timeoutMs),
      };
      this.waiters.push(waiter);
    });
  }

  close() {
    if (this.ws && this.ws.readyState < WebSocket.CLOSING) {
      this.ws.close(1000, 'smoke complete');
    }
  }

  resolveWaiters(message) {
    for (const waiter of [...this.waiters]) {
      if (!waiter.predicate(message)) continue;
      clearTimeout(waiter.timer);
      this.waiters = this.waiters.filter((item) => item !== waiter);
      waiter.resolve(message);
    }
  }

  rejectWaiters(error) {
    for (const waiter of this.waiters) {
      clearTimeout(waiter.timer);
      waiter.reject(error);
    }
    this.waiters = [];
  }
}

async function main() {
  let serverProcess = null;
  let campaignId = null;
  let sessionId = null;
  const sockets = [];

  try {
    if (shouldStartServer) {
      await applyLocalMigrations();
      serverProcess = startServer();
    }

    await waitForHealth();

    const director = new ApiClient('director', 'director');
    const player = new ApiClient('player', 'player');
    await director.login();
    await player.login();
    const smokeScenes = await loadSmokeScenes();

    const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    await smokePreparedLibraryCopy(director, runId);
    const campaign = await director.request('/api/campaigns', {
      method: 'POST',
      body: {
        name: `Smoke Live Scenes ${runId}`,
        description: 'Ephemeral five-scene live-session smoke test campaign.',
      },
    });
    campaignId = campaign.id;

    const session = await director.request(`/api/campaigns/${campaignId}/sessions`, {
      method: 'POST',
      body: {
        name: 'Smoke Live Session',
        description: 'Director/player WebSocket smoke test.',
      },
    });
    sessionId = session.id;

    const scenes = await createSmokeScenes(director, sessionId, smokeScenes);

    const hero = await player.request('/api/heroes', {
      method: 'POST',
      body: {
        name: `Smoke Hero ${runId}`,
        ancestry: 'human',
        heroClass: 'elementalist',
        level: 1,
        characteristics: { might: 1, agility: 1, reason: 2, intuition: 0, presence: 0 },
        abilities: ['meteoric-introduction'],
        data: { staminaCurrent: 18, recoveriesCurrent: 8 },
      },
    });

    const roomCode = randomRoomCode();
    await director.request(`/api/sessions/${sessionId}/go-live`, {
      method: 'PUT',
      body: { roomCode, sceneId: scenes.battle.id },
    });

    const lookup = await player.request(`/api/sessions/by-code/${roomCode}`);
    assert(lookup.session.id === sessionId, 'player could not resolve the smoke room code');

    await player.request(`/api/sessions/${sessionId}/join`, {
      method: 'POST',
      body: { hero_id: hero.id },
    });

    const directorSocket = await openSessionSocket(director, sessionId, 'director');
    const playerSocket = await openSessionSocket(player, sessionId, 'player');
    sockets.push(directorSocket, playerSocket);

    directorSocket.send({ type: 'request_state' });
    playerSocket.send({ type: 'request_state' });

    const directorStateMessage = await directorSocket.waitFor(hasReadyBattleState(scenes.battle.id, hero.id), 'director battle state');
    const playerStateMessage = await playerSocket.waitFor(hasReadyBattleState(scenes.battle.id, hero.id), 'player battle state');

    const directorState = directorStateMessage.state;
    const playerState = playerStateMessage.state;
    assert(directorState.sessionId === sessionId, 'director state has wrong session id');
    assert(playerState.sessionId === sessionId, 'player state has wrong session id');
    assertStateHasSceneTypes(directorState, ['story', 'montage', 'negotiation', 'battle', 'respite']);
    assert(playerState.entities.some((entity) => entity.id === hero.id && entity.type === 'hero'), 'player hero was not hydrated');

    const villain = directorState.entities.find((entity) => entity.type === 'monster' || entity.type === 'npc');
    assert(villain, 'demo battle villain token was not hydrated');

    playerSocket.send({
      type: 'move_token',
      entityId: hero.id,
      x: villain.x,
      y: Math.min((villain.y ?? 0) + 1, 21),
    });
    await Promise.all([
      directorSocket.waitFor(hasEntityMoved(hero.id), 'director hero setup move'),
      playerSocket.waitFor(hasEntityMoved(hero.id), 'player hero setup move'),
    ]);

    playerSocket.send({ type: 'ready', ready: true });
    await directorSocket.waitFor(
      (message) => message.type === 'participant_update' &&
        message.participants.some((participant) => participant.userId === player.user.id && participant.ready),
      'player ready participant update',
    );

    await director.request(`/api/sessions/${sessionId}/start`, { method: 'POST' });
    await Promise.all([
      directorSocket.waitFor((message) => message.type === 'session_started', 'director session_started'),
      playerSocket.waitFor((message) => message.type === 'session_started', 'player session_started'),
    ]);

    directorSocket.send({
      type: 'combat_action',
      action: {
        type: 'START_COMBAT',
        heroEntityIds: [hero.id],
        villainEntityIds: [villain.id],
      },
    });

    const [directorCombatMessage] = await Promise.all([
      directorSocket.waitFor(hasCombat(hero.id, villain.id), 'director combat update'),
      playerSocket.waitFor(hasCombat(hero.id, villain.id), 'player combat update'),
    ]);

    await smokeBattleTokenActions(directorSocket, playerSocket, directorCombatMessage.combat, hero.id, villain.id);

    if (shouldHoldOpen) {
      console.log([
        `hold live smoke: director=${director.user.username}`,
        `player=${player.user.username}`,
        `room=${roomCode}`,
        `session=${sessionId}`,
        `playerUrl=${frontendOrigin}/app/session/${sessionId}`,
        `playerLoginUrl=${apiBase}/api/auth/dev-login?role=player`,
      ].join(' '));
      await delay(holdOpenDurationMs);
      return;
    }

    await smokeBattleSnapshotRestore(directorSocket, playerSocket, scenes.story, scenes.battle, villain.id);

    await smokeStoryScene(directorSocket, playerSocket, scenes.story);
    await smokeMontageScene(directorSocket, playerSocket, scenes.montage, player.user.id);
    await smokeNegotiationScene(directorSocket, playerSocket, scenes.negotiation);
    await smokeRespiteScene(directorSocket, playerSocket, scenes.respite, player.user.id);

    console.log(`ok live smoke: director=${director.user.username} player=${player.user.username} room=${roomCode} scenes=story,montage,negotiation,battle,respite`);
  } finally {
    for (const socket of sockets) socket.close();
    if (sessionId) {
      try {
        const director = new ApiClient('cleanup-director', 'director');
        await director.login();
        await director.request(`/api/sessions/${sessionId}/end`, { method: 'POST' });
      } catch {
        // Best-effort cleanup. The campaign soft-delete below is enough for list hygiene.
      }
    }
    if (campaignId) {
      try {
        const director = new ApiClient('cleanup-director', 'director');
        await director.login();
        await director.request(`/api/campaigns/${campaignId}`, { method: 'DELETE' });
      } catch {
        // Best-effort cleanup only.
      }
    }
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  }
}

async function createSmokeScenes(director, sessionId, smokeScenes) {
  const entries = ['story', 'montage', 'negotiation', 'battle', 'respite'].map((type) => smokeScenes[type]);
  const scenes = {};
  for (const scene of entries) {
    const result = await director.request(`/api/sessions/${sessionId}/scenes`, {
      method: 'POST',
      body: {
        title: scene.title,
        type: scene.type,
        data: JSON.stringify(scene.data),
      },
    });
    scenes[scene.type] = { ...scene, id: result.id };
  }
  return scenes;
}

async function smokePreparedLibraryCopy(director, runId) {
  const library = await director.request('/api/campaigns/library');
  const sourceScene = library.scenes?.find((scene) => scene.type === 'battle') ?? library.scenes?.[0];
  if (!sourceScene) return;

  const campaign = await director.request('/api/campaigns', {
    method: 'POST',
    body: {
      name: `Smoke Prepared Copy ${runId}`,
      description: 'Ephemeral prepared-state copy smoke test.',
      sourceSceneIds: [sourceScene.id],
    },
  });

  try {
    const sessions = await director.request(`/api/campaigns/${campaign.id}/sessions`);
    const selectedSession = sessions.sessions?.find((session) => session.name === 'Selected Scenes');
    assert(selectedSession?.id, 'prepared scene copy did not create a Selected Scenes session');
    const copiedScenes = await director.request(`/api/sessions/${selectedSession.id}/scenes`);
    assert(
      copiedScenes.scenes?.some((scene) => scene.title === sourceScene.title && !scene.snapshot),
      'prepared scene copy did not create a snapshot-free copied scene',
    );
  } finally {
    await director.request(`/api/campaigns/${campaign.id}`, { method: 'DELETE' });
  }
}

async function openSessionSocket(client, sessionId, label) {
  const { token } = await client.request(`/api/sessions/${sessionId}/ws-token`, {
    method: 'POST',
    body: {},
  });
  assert(token, `${label} did not receive a WebSocket token`);

  const url = new URL(`/api/sessions/${sessionId}/ws`, apiBase);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('token', token);

  const socket = new SessionSocket(label, url.toString());
  await socket.connect();
  return socket;
}

async function smokeStoryScene(directorSocket, playerSocket, scene) {
  await switchScene(directorSocket, playerSocket, scene, hasActiveScene(scene.id, 'story'));

  const readAloudText = `Smoke story update ${Date.now()}`;
  directorSocket.send({ type: 'story_update', readAloudText });
  await Promise.all([
    directorSocket.waitFor(hasStoryUpdate(readAloudText), 'director story update'),
    playerSocket.waitFor(hasStoryUpdate(readAloudText), 'player story update'),
  ]);
}

async function smokeMontageScene(directorSocket, playerSocket, scene, playerId) {
  await switchScene(directorSocket, playerSocket, scene, hasMontageState(scene.id));

  playerSocket.send({
    type: 'montage_roll',
    skillId: 'navigate',
    characteristicId: 'intuition',
  });
  await Promise.all([
    directorSocket.waitFor(hasMontageRoll(playerId), 'director montage roll'),
    playerSocket.waitFor(hasMontageRoll(playerId), 'player montage roll'),
  ]);
  await Promise.all([
    directorSocket.waitFor(hasActionLog('montage', 'rolled navigate'), 'director montage action log'),
    playerSocket.waitFor(hasActionLog('montage', 'rolled navigate'), 'player montage action log'),
  ]);
}

async function smokeNegotiationScene(directorSocket, playerSocket, scene) {
  const stateMessage = await switchScene(directorSocket, playerSocket, scene, hasNegotiationState(scene.id));
  const startingInterest = stateMessage.state.negotiation.interest;

  directorSocket.send({ type: 'negotiation_adjust_interest', delta: 1 });
  await Promise.all([
    directorSocket.waitFor(hasNegotiationInterest(Math.min(5, startingInterest + 1)), 'director negotiation interest update'),
    playerSocket.waitFor(hasNegotiationInterest(Math.min(5, startingInterest + 1)), 'player negotiation interest update'),
  ]);
  await Promise.all([
    directorSocket.waitFor(hasActionLog('negotiation', 'adjusted interest'), 'director negotiation action log'),
    playerSocket.waitFor(hasActionLog('negotiation', 'adjusted interest'), 'player negotiation action log'),
  ]);
}

async function smokeRespiteScene(directorSocket, playerSocket, scene, playerId) {
  const stateMessage = await switchScene(directorSocket, playerSocket, scene, hasRespiteState(scene.id));
  const activity = stateMessage.state.respite.activities[0];
  assert(activity?.activityId, 'respite scene did not hydrate any activities');

  playerSocket.send({ type: 'respite_choose_activity', activityId: activity.activityId });
  await Promise.all([
    directorSocket.waitFor(hasClaimedRespiteActivity(activity.activityId, playerId), 'director respite activity claim'),
    playerSocket.waitFor(hasClaimedRespiteActivity(activity.activityId, playerId), 'player respite activity claim'),
  ]);
  await Promise.all([
    directorSocket.waitFor(hasActionLog('respite', 'claimed'), 'director respite claim action log'),
    playerSocket.waitFor(hasActionLog('respite', 'claimed'), 'player respite claim action log'),
  ]);

  playerSocket.send({ type: 'respite_complete_activity', activityId: activity.activityId });
  await Promise.all([
    directorSocket.waitFor(hasCompletedRespiteActivity(activity.activityId, playerId), 'director respite activity completion'),
    playerSocket.waitFor(hasCompletedRespiteActivity(activity.activityId, playerId), 'player respite activity completion'),
  ]);
  await Promise.all([
    directorSocket.waitFor(hasActionLog('respite', 'completed'), 'director respite completion action log'),
    playerSocket.waitFor(hasActionLog('respite', 'completed'), 'player respite completion action log'),
  ]);
}

async function switchScene(directorSocket, playerSocket, scene, statePredicate) {
  directorSocket.send({ type: 'switch_scene', sceneId: scene.id });
  const [directorState] = await Promise.all([
    directorSocket.waitFor(statePredicate, `director ${scene.type} state`),
    playerSocket.waitFor(statePredicate, `player ${scene.type} state`),
  ]);
  return directorState;
}

async function smokeBattleTokenActions(directorSocket, playerSocket, combat, heroId, villainId) {
  let currentCombat = combat;
  if (currentCombat.initiativeRoll === null || !currentCombat.activeSide) {
    playerSocket.send({ type: 'combat_action', action: { type: 'ROLL_INITIATIVE' } });
    const [directorInitiativeMessage] = await Promise.all([
      directorSocket.waitFor(hasInitiativeRolled(), 'director initiative roll'),
      playerSocket.waitFor(hasInitiativeRolled(), 'player initiative roll'),
    ]);
    currentCombat = directorInitiativeMessage.combat;
  }

  if (currentCombat.activeSide === 'villains') {
    directorSocket.send({ type: 'combat_action', action: { type: 'SELECT_TURN', entityId: villainId } });
    await Promise.all([
      directorSocket.waitFor(hasActiveTurn(villainId), 'director villain active turn'),
      playerSocket.waitFor(hasActiveTurn(villainId), 'player villain active turn'),
    ]);

    directorSocket.send({
      type: 'token_action',
      action: { kind: 'free-strike', sourceId: villainId, targetId: heroId },
    });
    await Promise.all([
      directorSocket.waitFor(hasTokenAction('free-strike', villainId, heroId), 'director villain free strike'),
      playerSocket.waitFor(hasTokenAction('free-strike', villainId, heroId), 'player villain free strike'),
    ]);

    directorSocket.send({ type: 'combat_action', action: { type: 'END_TURN' } });
    await Promise.all([
      directorSocket.waitFor(hasActiveSide('heroes'), 'director heroes side after villain turn'),
      playerSocket.waitFor(hasActiveSide('heroes'), 'player heroes side after villain turn'),
    ]);
  }

  playerSocket.send({ type: 'combat_action', action: { type: 'CLAIM_TURN', entityId: heroId } });
  await Promise.all([
    directorSocket.waitFor(hasActiveTurn(heroId), 'director hero active turn'),
    playerSocket.waitFor(hasActiveTurn(heroId), 'player hero active turn'),
  ]);

  playerSocket.send({
    type: 'token_action',
    action: {
      kind: 'ability',
      sourceId: heroId,
      targetId: villainId,
      abilityId: 'meteoric-introduction',
    },
  });
  await Promise.all([
    directorSocket.waitFor(hasTokenAction('ability', heroId, villainId), 'director player ability action'),
    playerSocket.waitFor(hasTokenAction('ability', heroId, villainId), 'player ability action'),
  ]);
  await Promise.all([
    directorSocket.waitFor(hasActionLog('battle', 'used'), 'director battle ability action log'),
    playerSocket.waitFor(hasActionLog('battle', 'used'), 'player battle ability action log'),
  ]);

  directorSocket.send({
    type: 'token_action',
    action: { kind: 'manual-damage', targetId: villainId, amount: 1 },
  });
  await Promise.all([
    directorSocket.waitFor(hasTokenAction('manual-damage', null, villainId), 'director manual damage'),
    playerSocket.waitFor(hasTokenAction('manual-damage', null, villainId), 'player manual damage'),
  ]);

  directorSocket.send({
    type: 'token_action',
    action: { kind: 'apply-condition', targetId: villainId, condition: 'prone' },
  });
  await Promise.all([
    directorSocket.waitFor(hasTokenAction('apply-condition', null, villainId), 'director apply condition'),
    playerSocket.waitFor(hasTokenAction('apply-condition', null, villainId), 'player apply condition'),
  ]);

  directorSocket.send({
    type: 'token_action',
    action: { kind: 'manual-heal', targetId: villainId, amount: 1 },
  });
  await Promise.all([
    directorSocket.waitFor(hasTokenAction('manual-heal', null, villainId), 'director manual heal'),
    playerSocket.waitFor(hasTokenAction('manual-heal', null, villainId), 'player manual heal'),
  ]);

  playerSocket.send({
    type: 'draw_steel_roll',
    roll: { kind: 'heroic-resource' },
  });
  await Promise.all([
    directorSocket.waitFor(hasDrawSteelRoll('heroic-resource'), 'director heroic resource roll'),
    playerSocket.waitFor(hasDrawSteelRoll('heroic-resource'), 'player heroic resource roll'),
  ]);
  await Promise.all([
    directorSocket.waitFor(hasActionLog('battle', 'Heroic Resource'), 'director dice action log'),
    playerSocket.waitFor(hasActionLog('battle', 'Heroic Resource'), 'player dice action log'),
  ]);
}

async function smokeBattleSnapshotRestore(directorSocket, playerSocket, storyScene, battleScene, villainId) {
  await switchScene(directorSocket, playerSocket, storyScene, hasActiveScene(storyScene.id, 'story'));
  await switchScene(directorSocket, playerSocket, battleScene, hasBattleSnapshotState(battleScene.id, villainId));
}

async function loadSmokeScenes() {
  const demoScenes = await loadBuiltDemoScenes();
  const findDemo = (title, type) => demoScenes.find((scene) => scene.title === title && scene.type === type);
  const montage = findDemo('A Chase Through a Trap Riddled Swamp', 'montage');
  const negotiation = findDemo('Negotiation with a Thief', 'negotiation');
  const battle = findDemo('Get the Sword!', 'battle');

  return {
    story: {
      title: 'Smoke Story Beat',
      type: 'story',
      data: FALLBACK_STORY_SCENE,
    },
    montage: {
      title: montage?.title ?? 'A Chase Through a Trap Riddled Swamp',
      type: 'montage',
      data: montage?.data ?? FALLBACK_MONTAGE_SCENE,
    },
    negotiation: {
      title: negotiation?.title ?? 'Negotiation with a Thief',
      type: 'negotiation',
      data: negotiation?.data ?? FALLBACK_NEGOTIATION_SCENE,
    },
    battle: {
      title: battle?.title ?? 'Get the Sword!',
      type: 'battle',
      data: battle?.data ?? FALLBACK_DEMO_BATTLE_SCENE,
    },
    respite: {
      title: 'Smoke Respite',
      type: 'respite',
      data: FALLBACK_RESPITE_SCENE,
    },
  };
}

async function loadBuiltDemoScenes() {
  try {
    const dataModule = await import(new URL('../packages/data/dist/index.js', import.meta.url));
    return dataModule.MCDM_DRAW_STEEL_DEMO_CAMPAIGN?.modules?.flatMap((module) =>
      module.sessions.flatMap((session) => session.scenes),
    ) ?? [];
  } catch {
    return [];
  }
}

function hasReadyBattleState(sceneId, heroId) {
  return (message) => {
    if (message.type !== 'state') return false;
    const state = message.state;
    return state.activeSceneId === sceneId &&
      state.scenes.some((scene) => scene.id === sceneId && scene.type === 'battle') &&
      state.entities.some((entity) => entity.id === heroId && entity.type === 'hero') &&
      state.entities.some((entity) => entity.type === 'monster' || entity.type === 'npc');
  };
}

function hasActiveScene(sceneId, type) {
  return (message) => message.type === 'state' &&
    message.state.activeSceneId === sceneId &&
    message.state.scenes.some((scene) => scene.id === sceneId && scene.type === type);
}

function hasBattleSnapshotState(sceneId, villainId) {
  return (message) => {
    if (!hasActiveScene(sceneId, 'battle')(message)) return false;
    const villain = message.state.entities.find((entity) => entity.id === villainId);
    return Array.isArray(villain?.conditions) && villain.conditions.includes('prone');
  };
}

function hasStoryUpdate(readAloudText) {
  return (message) => message.type === 'story_updated' && message.readAloudText === readAloudText;
}

function hasMontageState(sceneId) {
  return (message) => hasActiveScene(sceneId, 'montage')(message) &&
    message.state.montage !== null &&
    message.state.montage.successLimit > 0 &&
    message.state.montage.failureLimit > 0;
}

function hasMontageRoll(playerId) {
  return (message) => message.type === 'montage_updated' &&
    message.testLog.some((entry) => entry.playerId === playerId);
}

function hasNegotiationState(sceneId) {
  return (message) => hasActiveScene(sceneId, 'negotiation')(message) &&
    message.state.negotiation !== null &&
    message.state.negotiation.phase === 'active';
}

function hasNegotiationInterest(interest) {
  return (message) => message.type === 'negotiation_updated' && message.interest === interest;
}

function hasRespiteState(sceneId) {
  return (message) => hasActiveScene(sceneId, 'respite')(message) &&
    message.state.respite !== null &&
    message.state.respite.activities.length > 0;
}

function hasClaimedRespiteActivity(activityId, playerId) {
  return (message) => message.type === 'respite_updated' &&
    message.activities.some((activity) => activity.activityId === activityId && activity.claimedBy === playerId);
}

function hasCompletedRespiteActivity(activityId, playerId) {
  return (message) => message.type === 'respite_updated' &&
    message.activities.some((activity) => activity.activityId === activityId && activity.completed) &&
    message.completedBy[playerId]?.includes(activityId);
}

function assertStateHasSceneTypes(state, expectedTypes) {
  const sceneTypes = new Set(state.scenes.map((scene) => scene.type));
  for (const type of expectedTypes) {
    assert(sceneTypes.has(type), `session state is missing ${type} scene`);
  }
}

function hasCombat(heroId, villainId) {
  return (message) => message.type === 'combat_updated' &&
    message.combat?.heroEntities.includes(heroId) &&
    message.combat?.villainEntities.includes(villainId) &&
    message.combat.round === 1;
}

function hasInitiativeRolled() {
  return (message) => message.type === 'combat_updated' &&
    message.combat?.initiativeRoll !== null &&
    (message.combat?.activeSide === 'heroes' || message.combat?.activeSide === 'villains');
}

function hasEntityMoved(entityId) {
  return (message) => message.type === 'entity_moved' && message.entityId === entityId;
}

function hasActiveTurn(entityId) {
  return (message) => message.type === 'combat_updated' &&
    message.combat?.activeEntityId === entityId;
}

function hasActiveSide(side) {
  return (message) => message.type === 'combat_updated' &&
    message.combat?.activeSide === side &&
    message.combat.activeEntityId === null;
}

function hasTokenAction(kind, sourceId, targetId) {
  return (message) => message.type === 'token_action_resolved' &&
    message.result.kind === kind &&
    (sourceId === null || message.result.sourceId === sourceId) &&
    (targetId === null || message.result.targetId === targetId);
}

function hasDrawSteelRoll(kind) {
  return (message) => message.type === 'draw_steel_roll_resolved' &&
    message.result.kind === kind &&
    Array.isArray(message.result.dice) &&
    message.result.dice.length > 0;
}

function hasActionLog(sceneType, titleFragment) {
  return (message) => message.type === 'action_logged' &&
    message.entry.sceneType === sceneType &&
    message.entry.title.includes(titleFragment);
}

async function waitForHealth() {
  const startedAt = Date.now();
  let lastError = null;
  while (Date.now() - startedAt < HEALTH_TIMEOUT_MS) {
    try {
      const res = await fetchWithTimeout(`${apiBase}/api/health`, {}, HEALTH_REQUEST_TIMEOUT_MS);
      if (res.ok) return;
      lastError = new Error(`health returned ${res.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(500);
  }
  throw new Error(`API health check failed at ${apiBase}/api/health: ${lastError?.message ?? 'timeout'}`);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = API_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function applyLocalMigrations() {
  const command = packageManagerCommand([
    '--filter',
    '@anvil/server',
    'exec',
    'wrangler',
    'd1',
    'migrations',
    'apply',
    'anvil-db',
    '--local',
    '--persist-to',
    smokeWranglerState,
  ]);
  await runCommand(command.file, command.args);
}

function startServer() {
  const command = packageManagerCommand([
    '--filter',
    '@anvil/server',
    'exec',
    'wrangler',
    'dev',
    '--port',
    String(new URL(apiBase).port || 8787),
    '--var',
    'SESSION_SECRET:smoke-test-session-secret',
    '--var',
    'ENVIRONMENT:development',
    '--var',
    `FRONTEND_URL:${frontendOrigin}`,
    '--persist-to',
    smokeWranglerState,
  ]);

  const child = spawn(command.file, command.args, {
    cwd: repoRoot,
    env: childEnv(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => process.stdout.write(`[server] ${chunk}`));
  child.stderr.on('data', (chunk) => process.stderr.write(`[server] ${chunk}`));
  child.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`[server] exited with code ${code}`);
    } else if (signal) {
      console.error(`[server] exited with signal ${signal}`);
    }
  });
  child.on('error', (error) => {
    console.error(`[server] failed to start: ${error.message}`);
  });
  return child;
}

function runCommand(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: repoRoot,
      env: childEnv(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk;
      process.stdout.write(chunk);
    });
    child.stderr.on('data', (chunk) => {
      output += chunk;
      process.stderr.write(chunk);
    });
    child.on('error', (error) => {
      reject(new Error(`Failed to start ${command}: ${error.message}`));
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${commandArgs.join(' ')} failed with code ${code}\n${output}`));
    });
  });
}

function childEnv() {
  mkdirSync(smokeHome, { recursive: true });
  mkdirSync(`${smokeHome}/.config`, { recursive: true });
  mkdirSync(smokeWranglerState, { recursive: true });
  return {
    ...process.env,
    HOME: smokeHome,
    XDG_CONFIG_HOME: `${smokeHome}/.config`,
    WRANGLER_SEND_METRICS: 'false',
  };
}

function packageManagerCommand(commandArgs) {
  const pnpm = findExecutable('pnpm') ?? findExisting(['/opt/homebrew/bin/pnpm', '/usr/local/bin/pnpm']);
  if (pnpm) {
    return { file: pnpm, args: commandArgs };
  }

  const npmExecPath = process.env['npm_execpath'];
  if (npmExecPath?.includes('pnpm') && existsSync(npmExecPath)) {
    return { file: process.execPath, args: [npmExecPath, ...commandArgs] };
  }

  throw new Error('Could not find pnpm. Run this script from a shell where pnpm is available.');
}

function findExecutable(name) {
  for (const dir of (process.env['PATH'] ?? '').split(':')) {
    if (!dir) continue;
    const candidate = `${dir}/${name}`;
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function findExisting(paths) {
  return paths.find((path) => existsSync(path)) ?? null;
}

function randomRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

function getSetCookies(headers) {
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie();
  }
  const cookie = headers.get('set-cookie');
  if (!cookie) return [];
  return cookie.split(/,(?=\s*[^;,]+=)/);
}

async function safeText(res) {
  const text = await res.text().catch(() => '');
  return text || res.statusText;
}

function stripTrailingSlash(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function argValue(name) {
  const inlinePrefix = `${name}=`;
  const inline = rawArgs.find((arg) => arg.startsWith(inlinePrefix));
  if (inline) return inline.slice(inlinePrefix.length);
  const index = rawArgs.indexOf(name);
  if (index === -1) return null;
  const value = rawArgs[index + 1];
  return value && !value.startsWith('--') ? value : null;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

main().catch((error) => {
  console.error(`not ok live smoke: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
