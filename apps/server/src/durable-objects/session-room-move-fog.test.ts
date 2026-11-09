import { describe, it, expect, vi } from 'vitest';

// SessionRoom.ts extends the Workers runtime's DurableObject, which only exists
// inside workerd. These tests drive the real handler with fake sockets.
vi.mock('cloudflare:workers', () => ({ DurableObject: class {} }));

const { SessionRoom } = await import('./SessionRoom.js');
const { redactStateForPlayer } = await import('./session-redaction.js');

type Message = Record<string, unknown> & { type: string };
type Point = { x: number; y: number };

interface FakeEntity {
  id: string;
  name: string;
  type: 'hero' | 'monster';
  x: number;
  y: number;
}

interface RoomInternals {
  ctx: unknown;
  sessionState: unknown;
  getMetaForSocket: (ws: unknown) => unknown;
  scheduleActiveSceneSnapshot: () => void;
  handleCommitMove: (ws: unknown, meta: unknown, entityId: string, path: Point[], mode: 'advance') => void;
  handleTokenAction: (ws: unknown, meta: unknown, action: Record<string, unknown>) => Promise<void>;
}

// Columns 5 to 7 of row 5 are fogged.
const FOG = { id: 'fog-1', x: 5, y: 5, w: 3, h: 1 };
const DIRECTOR_META = { role: 'director', userId: 'd', sessionId: 's' };
const PLAYER_META = { role: 'player', userId: 'p', sessionId: 's', heroId: 'hero-1' };

function setup(entities: FakeEntity[], fog: unknown[] = [FOG], combat: unknown = null) {
  const received = { director: [] as Message[], player: [] as Message[] };
  const socket = (inbox: Message[]) => ({ send: (data: string) => inbox.push(JSON.parse(data) as Message) });
  const directorWs = socket(received.director);
  const playerWs = socket(received.player);

  const room = Object.create(SessionRoom.prototype) as RoomInternals;
  room.ctx = { getWebSockets: () => [directorWs, playerWs] };
  room.getMetaForSocket = (ws) => (ws === directorWs ? DIRECTOR_META : PLAYER_META);
  room.scheduleActiveSceneSnapshot = () => {};
  room.sessionState = {
    sessionId: 's',
    activeSceneId: 'scene-1',
    scenes: [{ id: 'scene-1', type: 'battle', data: { gridCols: 20, gridRows: 20, fog } }],
    entities,
    combat,
    actionLog: [],
  };
  const state = room.sessionState as { scenes: Array<{ data: { fog: unknown[] } }>; actionLog: Array<Record<string, unknown>> };

  return {
    received,
    move: (entityId: string, path: Point[]) => room.handleCommitMove(directorWs, DIRECTOR_META, entityId, path, 'advance'),
    playerAction: async (action: Record<string, unknown>) => {
      const before = received.player.length;
      await room.handleTokenAction(playerWs, PLAYER_META, action);
      return received.player.slice(before);
    },
    liftFog: () => {
      state.scenes[0]!.data.fog = [];
    },
    log: state.actionLog,
    reconnectState: () => redactStateForPlayer(room.sessionState as Parameters<typeof redactStateForPlayer>[0]),
    moveCommitted: (inbox: Message[]) => inbox.filter((message) => message.type === 'move_committed'),
    ofType: (inbox: Message[], type: string) => inbox.filter((message) => message.type === type),
  };
}

const hero = (x: number, y: number): FakeEntity => ({ id: 'hero-1', name: 'Aria', type: 'hero', x, y });
const ogre = (x: number, y: number): FakeEntity => ({ id: 'ogre-1', name: 'Secret Ogre', type: 'monster', x, y });
const goblin = (x: number, y: number): FakeEntity => ({ id: 'goblin-1', name: 'Goblin', type: 'monster', x, y });

describe('commit_move and fog', () => {
  it('sends a hidden creature moving inside fog to the Director only', () => {
    const room = setup([hero(0, 0), ogre(5, 5)]);
    const path = [{ x: 5, y: 5 }, { x: 6, y: 5 }];
    room.move('ogre-1', path);

    expect(room.moveCommitted(room.received.player)).toEqual([]);
    expect(room.ofType(room.received.player, 'action_logged')).toEqual([]);
    expect(JSON.stringify(room.received.player)).not.toContain('ogre-1');
    expect(JSON.stringify(room.received.player)).not.toContain('Secret Ogre');
    expect(room.moveCommitted(room.received.director)[0]).toMatchObject({ entityId: 'ogre-1', path });
  });

  it('makes a creature vanish when it walks into fog, with no move_committed', () => {
    const room = setup([hero(0, 0), goblin(4, 5)]);
    const path = [{ x: 4, y: 5 }, { x: 5, y: 5 }];
    room.move('goblin-1', path);

    expect(room.moveCommitted(room.received.player)).toEqual([]);
    expect(room.ofType(room.received.player, 'entity_deleted')).toEqual([{ type: 'entity_deleted', entityId: 'goblin-1' }]);
    expect(room.ofType(room.received.player, 'entity_moved')).toEqual([]);
    expect(room.moveCommitted(room.received.director)[0]).toMatchObject({ entityId: 'goblin-1', path });
  });

  it('sends nothing but entity_created when a creature leaves fog', () => {
    const room = setup([hero(0, 0), goblin(6, 5)]);
    const path = [{ x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }];
    room.move('goblin-1', path);

    expect(room.ofType(room.received.player, 'entity_created')).toHaveLength(1);
    expect(room.moveCommitted(room.received.player)).toEqual([]);
    expect(room.ofType(room.received.player, 'action_logged')).toEqual([]);
    expect(JSON.stringify(room.received.player)).not.toContain('Moved');
    expect(room.moveCommitted(room.received.director)[0]).toMatchObject({ path });
    expect(room.ofType(room.received.director, 'action_logged')).toHaveLength(1);
  });

  it('does not replay moves made while hidden after a reveal or reconnect', () => {
    const room = setup([hero(0, 0), ogre(5, 5)]);
    room.move('ogre-1', [{ x: 5, y: 5 }, { x: 6, y: 5 }]);
    room.liftFog();

    const stateLog = room.reconnectState().actionLog;
    expect(stateLog).toEqual([]);
    expect(JSON.stringify(room.reconnectState().entities)).toContain('ogre-1');
  });

  it('still shows old log entries that have no flag, and later visible moves', () => {
    const room = setup([hero(0, 0), goblin(3, 3)], []);
    room.log.push({ id: 'old', sceneType: 'battle', actorId: 'goblin-1', title: 'Old entry', timestamp: 1 });
    room.move('goblin-1', [{ x: 3, y: 3 }, { x: 3, y: 4 }]);

    expect(room.reconnectState().actionLog.map((entry) => entry.title)).toEqual(['Old entry', 'Goblin moved']);
  });

  it('trims fogged cells when a visible creature crosses fog', () => {
    const room = setup([hero(0, 0), goblin(4, 5)]);
    const path = [{ x: 4, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }];
    room.move('goblin-1', path);

    expect(room.moveCommitted(room.received.player)[0]).toMatchObject({ path: [{ x: 4, y: 5 }, { x: 8, y: 5 }] });
    expect(room.moveCommitted(room.received.director)[0]).toMatchObject({ path });
  });

  it('removes a hidden attacker from the opportunity attack data, and from the log count', () => {
    const room = setup([hero(5, 6), ogre(5, 5)]);
    const path = [{ x: 5, y: 6 }, { x: 5, y: 7 }, { x: 5, y: 8 }];
    room.move('hero-1', path);

    const [playerMove] = room.moveCommitted(room.received.player);
    expect(playerMove).toMatchObject({ entityId: 'hero-1', path, oaTriggers: [] });
    expect(JSON.stringify(room.received.player)).not.toContain('ogre-1');
    expect(JSON.stringify(room.received.player)).not.toContain('Secret Ogre');
    expect(JSON.stringify(room.received.player)).not.toContain('provoked');

    const [directorMove] = room.moveCommitted(room.received.director);
    expect(directorMove?.['oaTriggers']).toEqual([expect.objectContaining({ attackerId: 'ogre-1', attackerName: 'Secret Ogre' })]);
  });

  it('keeps opportunity attacks from players, even for a visible attacker, and still counts it in the log', () => {
    const room = setup([hero(3, 5), goblin(3, 4)], []);
    room.move('hero-1', [{ x: 3, y: 5 }, { x: 3, y: 6 }, { x: 3, y: 7 }]);

    expect(room.moveCommitted(room.received.player)[0]?.['oaTriggers']).toEqual([]);
    expect(room.moveCommitted(room.received.director)[0]?.['oaTriggers']).toEqual([
      expect.objectContaining({ attackerId: 'goblin-1' }),
    ]);
    expect(JSON.stringify(room.ofType(room.received.player, 'action_logged'))).toContain('provoked 1 opportunity attack');
  });
});

describe('commit_move path integrity', () => {
  const refused = (room: ReturnType<typeof setup>) => {
    expect(room.received.director).toEqual([
      expect.objectContaining({ type: 'error', code: 'INVALID_ACTION' }),
    ]);
    expect(room.received.player).toEqual([]);
  };

  it('refuses a path that does not start at the token', () => {
    const entity = hero(3, 3);
    const room = setup([entity], []);
    room.move('hero-1', [{ x: 4, y: 3 }, { x: 5, y: 3 }]);
    refused(room);
    expect(entity).toMatchObject({ x: 3, y: 3 });
  });

  it('refuses a path that skips squares', () => {
    const entity = hero(3, 3);
    const room = setup([entity], []);
    room.move('hero-1', [{ x: 3, y: 3 }, { x: 8, y: 3 }]);
    refused(room);
    expect(entity).toMatchObject({ x: 3, y: 3 });
  });

  it('refuses a skipped square later in the path, and a step that stays put', () => {
    const skipping = setup([hero(3, 3)], []);
    skipping.move('hero-1', [{ x: 3, y: 3 }, { x: 4, y: 3 }, { x: 6, y: 3 }]);
    refused(skipping);

    const standing = setup([hero(3, 3)], []);
    standing.move('hero-1', [{ x: 3, y: 3 }, { x: 3, y: 3 }]);
    refused(standing);
  });

  it('refuses a skip that would dodge an opportunity attack', () => {
    const entity = hero(3, 5);
    const room = setup([entity, goblin(3, 4)], []);
    room.move('hero-1', [{ x: 3, y: 5 }, { x: 9, y: 9 }]);
    refused(room);
    expect(entity).toMatchObject({ x: 3, y: 5 });
  });

  it('allows a real multi-step move with straight and diagonal steps', () => {
    const entity = hero(3, 3);
    const room = setup([entity], []);
    const path = [{ x: 3, y: 3 }, { x: 4, y: 4 }, { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 4 }];
    room.move('hero-1', path);

    expect(entity).toMatchObject({ x: 6, y: 4 });
    expect(room.moveCommitted(room.received.director)[0]).toMatchObject({ path, cost: 4 });
    expect(room.moveCommitted(room.received.player)[0]).toMatchObject({ path, cost: 4 });
  });

  it('allows a larger creature to move from its top-left square', () => {
    const entity = { ...goblin(3, 3), size: 2 };
    const room = setup([hero(0, 0), entity], []);
    room.move('goblin-1', [{ x: 3, y: 3 }, { x: 4, y: 4 }, { x: 5, y: 4 }]);

    expect(entity).toMatchObject({ x: 5, y: 4 });
    expect(room.moveCommitted(room.received.director)[0]).toMatchObject({ cost: 2 });
  });
});

describe('commit_move grid checks', () => {
  const refused = (room: ReturnType<typeof setup>) => {
    expect(room.received.director).toEqual([expect.objectContaining({ type: 'error', code: 'INVALID_ACTION' })]);
  };

  it('moves a fractional token from its rounded square', () => {
    const entity = hero(3.5, 3);
    const room = setup([entity], []);
    room.move('hero-1', [{ x: 4, y: 3 }, { x: 5, y: 3 }]);
    expect(entity).toMatchObject({ x: 5, y: 3 });
  });

  it('refuses the long oscillating path a fractional start used to produce', () => {
    const entity = hero(3.5, 3);
    const room = setup([entity], []);
    const path = Array.from({ length: 501 }, (_, index) => ({ x: index % 2 === 0 ? 3.5 : 4.5, y: 3 }));
    room.move('hero-1', path);
    refused(room);
    expect(entity).toMatchObject({ x: 3.5, y: 3 });
  });

  it('refuses fractional steps from a whole square', () => {
    const room = setup([hero(3, 3)], []);
    room.move('hero-1', [{ x: 3, y: 3 }, { x: 3.5, y: 3 }]);
    refused(room);
  });

  it('refuses cells outside the grid', () => {
    const entity = hero(19, 3);
    const room = setup([entity], []);
    room.move('hero-1', [{ x: 19, y: 3 }, { x: 20, y: 3 }]);
    refused(room);
    expect(entity).toMatchObject({ x: 19, y: 3 });

    const top = setup([hero(0, 0)], []);
    top.move('hero-1', [{ x: 0, y: 0 }, { x: 0, y: -1 }]);
    refused(top);
  });

  it('lets a token left off the map walk back from its clamped square', () => {
    const entity = hero(25, 3);
    const room = setup([entity], []);
    room.move('hero-1', [{ x: 19, y: 3 }, { x: 18, y: 3 }]);
    expect(entity).toMatchObject({ x: 18, y: 3 });
  });
});

describe('commit_move with real combat state', () => {
  const combat = (activeEntityId: string, id: string) => ({
    round: 1,
    activeSide: 'villains',
    activeEntityId,
    initiativeRoll: 5,
    heroEntities: ['hero-1'],
    villainEntities: [id],
    actedThisRound: [],
    turnActions: {
      'hero-1': { mainActionUsed: false, maneuverUsed: false, moveRemaining: 5, triggeredUsedThisRound: false, mainConvertedTo: null },
      [id]: { mainActionUsed: false, maneuverUsed: false, moveRemaining: 5, triggeredUsedThisRound: false, mainConvertedTo: null },
    },
  });
  const lastCombat = (inbox: Message[]) =>
    inbox.filter((message) => message.type === 'combat_updated').at(-1)?.['combat'] as {
      activeEntityId: string | null;
      villainEntities: string[];
      turnActions: Record<string, { moveRemaining: number }>;
    };

  it('keeps a hidden mover out of combat_updated for players', () => {
    const room = setup([hero(0, 0), ogre(5, 5)], [FOG], combat('ogre-1', 'ogre-1'));
    room.move('ogre-1', [{ x: 5, y: 5 }, { x: 6, y: 5 }]);

    const player = lastCombat(room.received.player);
    expect(player.activeEntityId).toBeNull();
    expect(player.villainEntities).toEqual([]);
    expect(player.turnActions['ogre-1']).toBeUndefined();
    expect(JSON.stringify(room.received.player)).not.toContain('ogre-1');
    expect(lastCombat(room.received.director).turnActions['ogre-1']?.moveRemaining).toBe(4);
  });

  it('does not show a creature leaving fog what it spent while hidden', () => {
    const room = setup([hero(0, 0), goblin(6, 5)], [FOG], combat('goblin-1', 'goblin-1'));
    room.move('goblin-1', [{ x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }]);

    const player = lastCombat(room.received.player);
    expect(player.activeEntityId).toBe('goblin-1');
    expect(player.villainEntities).toEqual(['goblin-1']);
    expect(player.turnActions['goblin-1']).toBeUndefined();
    expect(player.turnActions['hero-1']?.moveRemaining).toBe(5);
    expect(lastCombat(room.received.director).turnActions['goblin-1']?.moveRemaining).toBe(3);
  });

  it('keeps creature movement counts from players even with no fog at all', () => {
    const room = setup([hero(0, 0), goblin(3, 3)], [], combat('goblin-1', 'goblin-1'));
    room.move('goblin-1', [{ x: 3, y: 3 }, { x: 3, y: 4 }]);
    expect(lastCombat(room.received.player).turnActions['goblin-1']).toBeUndefined();
    expect(lastCombat(room.received.director).turnActions['goblin-1']?.moveRemaining).toBe(4);
  });
});

describe('player token actions at a hidden creature', () => {
  it.each(['charge', 'free-strike', 'grab', 'knockback', 'ability'])('%s replies the same as for an unknown id', async (kind) => {
    const ask = async (targetId: string, heroAt: [number, number]) => {
      const room = setup([hero(...heroAt), ogre(5, 5)]);
      return room.playerAction({ kind, sourceId: 'hero-1', targetId, abilityId: 'some-ability' });
    };
    const unknown = await ask('no-such-id', [5, 6]);
    expect(unknown).toHaveLength(1);
    expect(await ask('ogre-1', [5, 6])).toEqual(unknown); // adjacent
    expect(await ask('ogre-1', [0, 0])).toEqual(unknown); // far away
  });

  it.each(['manual-damage', 'manual-heal', 'apply-condition', 'remove-condition'])('%s replies the same as for an unknown id', async (kind) => {
    const room = setup([hero(5, 6), ogre(5, 5)]);
    const unknown = await room.playerAction({ kind, targetId: 'no-such-id', amount: 1, condition: 'prone' });
    expect(unknown).toEqual([expect.objectContaining({ message: 'Target entity not found' })]);
    expect(await room.playerAction({ kind, targetId: 'ogre-1', amount: 1, condition: 'prone' })).toEqual(unknown);
  });

  it('still lets a player charge a visible creature get a range reply', async () => {
    const room = setup([hero(0, 0), goblin(3, 3)], []);
    expect(await room.playerAction({ kind: 'charge', sourceId: 'hero-1', targetId: 'goblin-1' })).toEqual([
      expect.objectContaining({ message: 'Charge target must be adjacent at the end of the move' }),
    ]);
  });
});
