import { describe, it, expect, vi } from 'vitest';

// SessionRoom.ts extends the Workers runtime's DurableObject, which only exists
// inside workerd. These tests drive the real handler with fake sockets.
vi.mock('cloudflare:workers', () => ({ DurableObject: class {} }));

const { SessionRoom } = await import('./SessionRoom.js');

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
}

// Columns 5 to 7 of row 5 are fogged.
const FOG = { id: 'fog-1', x: 5, y: 5, w: 3, h: 1 };
const DIRECTOR_META = { role: 'director', userId: 'd', sessionId: 's' };
const PLAYER_META = { role: 'player', userId: 'p', sessionId: 's', heroId: 'hero-1' };

function setup(entities: FakeEntity[], fog: unknown[] = [FOG]) {
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
    combat: null,
    actionLog: [],
  };

  return {
    received,
    move: (entityId: string, path: Point[]) => room.handleCommitMove(directorWs, DIRECTOR_META, entityId, path, 'advance'),
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
    expect(room.moveCommitted(room.received.director)[0]).toMatchObject({ path });
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
