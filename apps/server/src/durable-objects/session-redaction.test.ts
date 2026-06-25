import { describe, it, expect } from 'vitest';
import type { SessionState, EntityData, NegotiationLiveState } from '../protocol.js';
import {
  parseFogZones,
  isInFog,
  isEntityHiddenFromPlayers,
  redactNegotiationLive,
  redactSceneDataNegotiation,
  redactStateForPlayer,
} from './session-redaction.js';

describe('parseFogZones', () => {
  it('extracts well-formed fog rectangles', () => {
    const zones = parseFogZones({ fog: [{ x: 1, y: 2, w: 3, h: 4 }] });
    expect(zones).toEqual([{ x: 1, y: 2, w: 3, h: 4 }]);
  });

  it('ignores malformed entries and missing fog', () => {
    expect(parseFogZones({})).toEqual([]);
    expect(parseFogZones(undefined)).toEqual([]);
    expect(parseFogZones({ fog: [{ x: 1, y: 2 }, null, 'nope'] })).toEqual([]);
  });
});

describe('isInFog', () => {
  const zones = [{ x: 0, y: 0, w: 2, h: 2 }];
  it('treats the zone as half-open [x, x+w)', () => {
    expect(isInFog(0, 0, zones)).toBe(true);
    expect(isInFog(1, 1, zones)).toBe(true);
    expect(isInFog(2, 2, zones)).toBe(false); // exclusive far edge
    expect(isInFog(-1, 0, zones)).toBe(false);
  });
});

describe('isEntityHiddenFromPlayers', () => {
  const zones = [{ x: 0, y: 0, w: 5, h: 5 }];
  it('never hides heroes', () => {
    const hero: EntityData = { id: 'h1', name: 'Hero', type: 'hero', x: 1, y: 1 };
    expect(isEntityHiddenFromPlayers(hero, zones)).toBe(false);
  });
  it('hides non-hero tokens inside fog', () => {
    const monster: EntityData = { id: 'm1', name: 'Ogre', type: 'monster', x: 1, y: 1 };
    expect(isEntityHiddenFromPlayers(monster, zones)).toBe(true);
  });
  it('shows non-hero tokens outside fog', () => {
    const monster: EntityData = { id: 'm2', name: 'Ogre', type: 'monster', x: 9, y: 9 };
    expect(isEntityHiddenFromPlayers(monster, zones)).toBe(false);
  });
  it('hides nothing when there are no fog zones', () => {
    const monster: EntityData = { id: 'm3', name: 'Ogre', type: 'monster', x: 1, y: 1 };
    expect(isEntityHiddenFromPlayers(monster, [])).toBe(false);
  });
});

describe('redactNegotiationLive', () => {
  const neg: NegotiationLiveState = {
    interest: 2,
    patience: 4,
    maxPatience: 5,
    phase: 'active',
    motivations: [
      { id: 'a', type: 'benevolence', description: 'SECRET A', revealed: false },
      { id: 'b', type: 'greed', description: 'SHOWN B', revealed: true },
    ],
    pitfalls: [{ id: 'c', type: 'power', description: 'SECRET C', revealed: false }],
    argumentLog: [],
  };

  it('clears descriptions of unrevealed secrets but keeps revealed ones', () => {
    const redacted = redactNegotiationLive(neg);
    expect(redacted.motivations[0]).toMatchObject({ id: 'a', revealed: false, description: '' });
    expect(redacted.motivations[1]).toMatchObject({ id: 'b', revealed: true, description: 'SHOWN B' });
    expect(redacted.pitfalls[0].description).toBe('');
  });

  it('does not mutate the original state', () => {
    redactNegotiationLive(neg);
    expect(neg.motivations[0].description).toBe('SECRET A');
  });
});

describe('redactSceneDataNegotiation', () => {
  it('redacts unrevealed secrets nested under template', () => {
    const data = {
      template: {
        motivations: [{ id: 'a', type: 'benevolence', description: 'SECRET', revealed: false }],
        pitfalls: [{ id: 'b', type: 'power', description: 'OK', revealed: true }],
      },
    };
    const redacted = redactSceneDataNegotiation(data) as typeof data;
    expect(redacted.template.motivations[0].description).toBe('');
    expect(redacted.template.pitfalls[0].description).toBe('OK');
    // original untouched
    expect(data.template.motivations[0].description).toBe('SECRET');
  });

  it('redacts top-level fallback secrets', () => {
    const data = { motivations: [{ id: 'a', type: 'fear', description: 'HIDDEN', revealed: false }] };
    const redacted = redactSceneDataNegotiation(data) as typeof data;
    expect(redacted.motivations[0].description).toBe('');
  });
});

describe('redactStateForPlayer', () => {
  function baseState(): SessionState {
    return {
      sessionId: 's1',
      campaignId: 'c1',
      activeSceneId: 'scene-battle',
      scenes: [
        { id: 'scene-battle', name: 'Fight', type: 'battle', order_index: 0, data: { fog: [{ x: 0, y: 0, w: 3, h: 3 }] } },
        {
          id: 'scene-neg',
          name: 'Talk',
          type: 'negotiation',
          order_index: 1,
          data: { template: { motivations: [{ id: 'm', type: 'greed', description: 'SECRET', revealed: false }] } },
        },
      ],
      entities: [
        { id: 'hero', name: 'Hero', type: 'hero', x: 1, y: 1 },
        { id: 'mon-fog', name: 'Hidden Ogre', type: 'monster', x: 1, y: 1 },
        { id: 'mon-open', name: 'Visible Ogre', type: 'monster', x: 9, y: 9 },
      ],
      combat: null,
      participants: [],
      actionLog: [],
      negotiation: {
        interest: 1,
        patience: 3,
        maxPatience: 5,
        phase: 'active',
        motivations: [{ id: 'm', type: 'greed', description: 'SECRET', revealed: false }],
        pitfalls: [],
        argumentLog: [],
      },
      montage: null,
      respite: null,
      audio: null,
    };
  }

  it('removes fog-hidden non-hero entities but keeps heroes and visible monsters', () => {
    const player = redactStateForPlayer(baseState());
    const ids = player.entities.map((e) => e.id);
    expect(ids).toContain('hero');
    expect(ids).toContain('mon-open');
    expect(ids).not.toContain('mon-fog');
  });

  it('redacts negotiation secrets in both live state and scene data', () => {
    const player = redactStateForPlayer(baseState());
    expect(player.negotiation?.motivations[0].description).toBe('');
    const negScene = player.scenes.find((s) => s.id === 'scene-neg');
    const motivations = (negScene?.data?.template as { motivations: Array<{ description: string }> }).motivations;
    expect(motivations[0].description).toBe('');
  });

  it('does not mutate the original director state', () => {
    const state = baseState();
    redactStateForPlayer(state);
    expect(state.entities.map((e) => e.id)).toContain('mon-fog');
    expect(state.negotiation?.motivations[0].description).toBe('SECRET');
  });
});
