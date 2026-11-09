import { describe, it, expect, vi } from 'vitest';

// SessionRoom.ts extends the Workers runtime's DurableObject, which only exists
// inside workerd. The parser under test never touches it.
vi.mock('cloudflare:workers', () => ({ DurableObject: class {} }));

const { parseClientMessagePayload } = await import('./SessionRoom.js');

const path = [
  { x: 3, y: 4 },
  { x: 4, y: 4 },
];

describe('parseClientMessagePayload: commit_move', () => {
  it('accepts a valid move', () => {
    const msg = { type: 'commit_move', entityId: 'hero-1', path, mode: 'advance' };
    expect(parseClientMessagePayload(msg)).toEqual({ msg });
  });

  it('accepts both movement modes', () => {
    const msg = { type: 'commit_move', entityId: 'hero-1', path, mode: 'disengage' };
    expect(parseClientMessagePayload(msg).msg).toEqual(msg);
  });

  it('accepts the longest path the client can draw', () => {
    const longPath = Array.from({ length: 501 }, (_, x) => ({ x, y: 0 }));
    const msg = { type: 'commit_move', entityId: 'hero-1', path: longPath, mode: 'advance' };
    expect(parseClientMessagePayload(msg).msg).toEqual(msg);
  });

  it('strips unknown fields from the message and from each point', () => {
    const parsed = parseClientMessagePayload({
      type: 'commit_move',
      entityId: 'hero-1',
      path: [{ x: 3, y: 4, extra: 'nope' }, { x: 4, y: 4 }],
      mode: 'advance',
      extra: 'nope',
    });
    expect(parsed.msg).toEqual({ type: 'commit_move', entityId: 'hero-1', path, mode: 'advance' });
  });

  it.each([
    ['a missing entity id', { path, mode: 'advance' }],
    ['a blank entity id', { entityId: '   ', path, mode: 'advance' }],
    ['an over-long entity id', { entityId: 'x'.repeat(221), path, mode: 'advance' }],
    ['a missing path', { entityId: 'hero-1', mode: 'advance' }],
    ['a path that is not an array', { entityId: 'hero-1', path: { x: 1, y: 1 }, mode: 'advance' }],
    ['an empty path', { entityId: 'hero-1', path: [], mode: 'advance' }],
    ['a single-point path', { entityId: 'hero-1', path: [{ x: 1, y: 1 }], mode: 'advance' }],
    [
      'a path over the limit',
      { entityId: 'hero-1', path: Array.from({ length: 513 }, () => ({ x: 1, y: 1 })), mode: 'advance' },
    ],
    ['a point that is not an object', { entityId: 'hero-1', path: [{ x: 1, y: 1 }, 'b'], mode: 'advance' }],
    ['a null point', { entityId: 'hero-1', path: [{ x: 1, y: 1 }, null], mode: 'advance' }],
    ['a string coordinate', { entityId: 'hero-1', path: [{ x: 1, y: 1 }, { x: '2', y: 1 }], mode: 'advance' }],
    ['a missing coordinate', { entityId: 'hero-1', path: [{ x: 1, y: 1 }, { x: 2 }], mode: 'advance' }],
    ['a NaN coordinate', { entityId: 'hero-1', path: [{ x: 1, y: 1 }, { x: NaN, y: 1 }], mode: 'advance' }],
    ['an infinite coordinate', { entityId: 'hero-1', path: [{ x: 1, y: 1 }, { x: 1, y: Infinity }], mode: 'advance' }],
    ['an out-of-range coordinate', { entityId: 'hero-1', path: [{ x: 1, y: 1 }, { x: 100_001, y: 1 }], mode: 'advance' }],
    ['a missing mode', { entityId: 'hero-1', path }],
    ['an unknown mode', { entityId: 'hero-1', path, mode: 'teleport' }],
    ['a non-string mode', { entityId: 'hero-1', path, mode: 1 }],
    ['an inherited object key as mode', { entityId: 'hero-1', path, mode: 'constructor' }],
  ])('refuses %s', (_label, fields) => {
    expect(parseClientMessagePayload({ type: 'commit_move', ...fields })).toEqual({ error: 'Invalid move' });
  });
});

describe('parseClientMessagePayload: resolve_opportunity_attack', () => {
  const trigger = {
    attackerId: 'goblin-1',
    attackerName: 'Goblin',
    targetId: 'hero-1',
    targetName: 'Hero',
    triggerGridX: 3,
    triggerGridY: 4,
    destinationGridX: 4,
    destinationGridY: 4,
  };

  it.each(['take', 'pass'])('accepts the %s decision', (decision) => {
    const msg = { type: 'resolve_opportunity_attack', trigger, decision };
    expect(parseClientMessagePayload(msg)).toEqual({ msg });
  });

  it('strips unknown trigger fields', () => {
    const parsed = parseClientMessagePayload({
      type: 'resolve_opportunity_attack',
      trigger: { ...trigger, extra: 'nope' },
      decision: 'take',
    });
    expect(parsed.msg).toEqual({ type: 'resolve_opportunity_attack', trigger, decision: 'take' });
  });

  it.each([
    ['a missing trigger', { decision: 'take' }],
    ['a non-object trigger', { trigger: 'goblin-1', decision: 'take' }],
    ['a blank attacker id', { trigger: { ...trigger, attackerId: ' ' }, decision: 'take' }],
    ['a missing target id', { trigger: { ...trigger, targetId: undefined }, decision: 'take' }],
    ['an over-long name', { trigger: { ...trigger, attackerName: 'x'.repeat(221) }, decision: 'pass' }],
    ['a non-numeric position', { trigger: { ...trigger, triggerGridX: '3' }, decision: 'take' }],
    ['a NaN position', { trigger: { ...trigger, destinationGridY: NaN }, decision: 'take' }],
    ['a missing decision', { trigger }],
    ['an unknown decision', { trigger, decision: 'maybe' }],
  ])('refuses %s', (_label, fields) => {
    expect(parseClientMessagePayload({ type: 'resolve_opportunity_attack', ...fields })).toEqual({
      error: 'Invalid opportunity attack',
    });
  });
});

describe('parseClientMessagePayload: token_action charge', () => {
  it('accepts a charge, which the handler and the token menu both support', () => {
    const parsed = parseClientMessagePayload({
      type: 'token_action',
      action: { kind: 'charge', sourceId: 'hero-1', targetId: 'goblin-1' },
    });
    expect(parsed.msg).toEqual({
      type: 'token_action',
      action: { kind: 'charge', sourceId: 'hero-1', targetId: 'goblin-1' },
    });
  });
});

describe('parseClientMessagePayload: messages that stay refused', () => {
  // No client sends this, and its handler has no ownership check: any connected
  // player could move any creature and deal slam damage. Keep it closed until
  // the handler enforces who may use it.
  it('refuses resolve_forced_movement', () => {
    expect(
      parseClientMessagePayload({
        type: 'resolve_forced_movement',
        sourceId: 'hero-1',
        targetId: 'goblin-1',
        kind: 'push',
        distance: 3,
      }),
    ).toEqual({ error: 'Unsupported message type' });
  });

  it('refuses an unknown type', () => {
    expect(parseClientMessagePayload({ type: 'nope' })).toEqual({ error: 'Unsupported message type' });
  });
});
