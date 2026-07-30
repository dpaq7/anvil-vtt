import { describe, it, expect } from 'vitest';
import type { SessionState, EntityData, CombatState, NegotiationLiveState } from '../protocol.js';
import {
  parseFogZones,
  isInFog,
  isEntityHiddenFromPlayers,
  hiddenEntityIds,
  hiddenEntityNames,
  redactCombatForPlayer,
  redactActionLogEntryForPlayer,
  tokenActionTouchesHidden,
  redactNegotiationLive,
  redactSceneDataNegotiation,
  redactStateForPlayer,
} from './session-redaction.js';

describe('parseFogZones', () => {
  it('extracts well-formed fog rectangles', () => {
    expect(parseFogZones({ fog: [{ x: 1, y: 2, w: 3, h: 4 }] })).toEqual([{ x: 1, y: 2, w: 3, h: 4 }]);
  });

  it('ignores malformed entries and missing fog', () => {
    expect(parseFogZones({})).toEqual([]);
    expect(parseFogZones(undefined)).toEqual([]);
    expect(parseFogZones({ fog: [{ x: 1, y: 2 }, null, 'nope'] })).toEqual([]);
  });
});

describe('isInFog', () => {
  const zones = [{ x: 0, y: 0, w: 2, h: 2 }];

  it('treats a zone as half-open [x, x + w)', () => {
    expect(isInFog(0, 0, zones)).toBe(true);
    expect(isInFog(1, 1, zones)).toBe(true);
    expect(isInFog(2, 2, zones)).toBe(false);
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

describe('redactCombatForPlayer', () => {
  const combat: CombatState = {
    round: 2,
    activeSide: 'villains',
    firstSide: 'heroes',
    initiativeRoll: 14,
    heroEntities: ['hero-1'],
    villainEntities: ['seen', 'hidden'],
    villainGroups: [
      { id: 'g1', name: 'Ogres', entityIds: ['seen', 'hidden'] },
      { id: 'g2', name: 'Ambushers', entityIds: ['hidden'] },
    ],
    actedThisRound: ['hero-1', 'hidden'],
    activeEntityId: 'hidden',
    malice: 7,
    turnActions: {
      'hero-1': { mainActionUsed: true, maneuverUsed: false, moveRemaining: 3, triggeredUsedThisRound: false, mainConvertedTo: null },
      hidden: { mainActionUsed: true, maneuverUsed: false, moveRemaining: 0, triggeredUsedThisRound: false, mainConvertedTo: null },
    },
  };
  const hidden = new Set(['hidden']);

  it('drops hidden combatants from the roster', () => {
    const player = redactCombatForPlayer(combat, hidden);
    expect(player.villainEntities).toEqual(['seen']);
    expect(player.heroEntities).toEqual(['hero-1']);
  });

  it('prunes hidden ids from villain groups and removes groups left empty', () => {
    const player = redactCombatForPlayer(combat, hidden);
    expect(player.villainGroups).toHaveLength(1);
    expect(player.villainGroups?.[0]).toMatchObject({ id: 'g1', entityIds: ['seen'] });
  });

  it('filters actedThisRound and turnActions so no raw id is left to render', () => {
    const player = redactCombatForPlayer(combat, hidden);
    expect(player.actedThisRound).toEqual(['hero-1']);
    expect(Object.keys(player.turnActions)).toEqual(['hero-1']);
  });

  it('clears activeEntityId when a hidden combatant is acting', () => {
    expect(redactCombatForPlayer(combat, hidden).activeEntityId).toBeNull();
    // ...but keeps the side, so players still see the villains are up
    expect(redactCombatForPlayer(combat, hidden).activeSide).toBe('villains');
  });

  it('keeps a visible activeEntityId', () => {
    const visibleTurn = { ...combat, activeEntityId: 'seen' };
    expect(redactCombatForPlayer(visibleTurn, hidden).activeEntityId).toBe('seen');
  });

  it('returns the original object when nothing is hidden', () => {
    expect(redactCombatForPlayer(combat, new Set())).toBe(combat);
  });

  it('does not mutate the director copy', () => {
    redactCombatForPlayer(combat, hidden);
    expect(combat.villainEntities).toEqual(['seen', 'hidden']);
    expect(combat.activeEntityId).toBe('hidden');
  });
});

describe('tokenActionTouchesHidden', () => {
  const hidden = new Set(['ogre']);

  it('is true when the hidden entity is source, target, or an effect subject', () => {
    expect(tokenActionTouchesHidden({ sourceId: 'ogre' }, hidden)).toBe(true);
    expect(tokenActionTouchesHidden({ targetId: 'ogre' }, hidden)).toBe(true);
    expect(tokenActionTouchesHidden({ effects: [{ entityId: 'ogre' }] }, hidden)).toBe(true);
  });

  it('is false for actions between visible entities', () => {
    expect(tokenActionTouchesHidden({ sourceId: 'hero', targetId: 'goblin', effects: [] }, hidden)).toBe(false);
  });

  it('is false when nothing is hidden', () => {
    expect(tokenActionTouchesHidden({ sourceId: 'ogre' }, new Set())).toBe(false);
  });
});

describe('redactActionLogEntryForPlayer', () => {
  const hidden = new Set(['ogre']);
  const names = ['Cave Ogre'];

  it('drops entries authored by a hidden entity', () => {
    const entry = { actorId: 'ogre', actorName: 'Cave Ogre', title: 'Cave Ogre used Smash' };
    expect(redactActionLogEntryForPlayer(entry, hidden, names)).toBeNull();
  });

  it('masks a hidden entity named inside a visible actor entry', () => {
    const entry = {
      actorId: 'hero-1',
      actorName: 'Kira',
      title: 'Kira used Strike on Cave Ogre',
      detail: 'Cave Ogre took 8 damage',
    };
    const redacted = redactActionLogEntryForPlayer(entry, hidden, names);
    expect(redacted?.title).toBe('Kira used Strike on Something');
    expect(redacted?.detail).toBe('Something took 8 damage');
    expect(redacted?.actorName).toBe('Kira');
  });

  it('leaves entries with no hidden reference untouched', () => {
    const entry = { actorId: 'hero-1', actorName: 'Kira', title: 'Kira used Strike on Goblin' };
    expect(redactActionLogEntryForPlayer(entry, hidden, names)).toBe(entry);
  });

  it('passes everything through when nothing is hidden', () => {
    const entry = { actorId: 'ogre', title: 'Cave Ogre used Smash' };
    expect(redactActionLogEntryForPlayer(entry, new Set(), [])).toBe(entry);
  });
});

describe('hiddenEntityIds / hiddenEntityNames', () => {
  const entities: EntityData[] = [
    { id: 'hero-1', name: 'Kira', type: 'hero', x: 1, y: 1 },
    { id: 'ogre', name: 'Cave Ogre', type: 'monster', x: 1, y: 1 },
    { id: 'goblin', name: 'Goblin', type: 'monster', x: 9, y: 9 },
  ];
  const fog = [{ x: 0, y: 0, w: 3, h: 3 }];

  it('collects only fog-hidden non-hero ids', () => {
    expect([...hiddenEntityIds(entities, fog)]).toEqual(['ogre']);
  });

  it('resolves those ids to names for text masking', () => {
    const hidden = hiddenEntityIds(entities, fog);
    expect(hiddenEntityNames(entities, hidden)).toEqual(['Cave Ogre']);
  });

  it('is empty when there is no fog', () => {
    expect(hiddenEntityIds(entities, []).size).toBe(0);
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

  it('clears unrevealed descriptions but keeps revealed ones', () => {
    const redacted = redactNegotiationLive(neg);
    expect(redacted.motivations[0]).toMatchObject({ id: 'a', revealed: false, description: '' });
    expect(redacted.motivations[1]).toMatchObject({ id: 'b', revealed: true, description: 'SHOWN B' });
    expect(redacted.pitfalls[0]?.description).toBe('');
  });

  it('does not mutate the original state', () => {
    redactNegotiationLive(neg);
    expect(neg.motivations[0]?.description).toBe('SECRET A');
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
    expect(redacted.template.motivations[0]?.description).toBe('');
    expect(redacted.template.pitfalls[0]?.description).toBe('OK');
    expect(data.template.motivations[0]?.description).toBe('SECRET');
  });

  it('redacts top-level fallback secrets', () => {
    const data = { motivations: [{ id: 'a', type: 'fear', description: 'HIDDEN', revealed: false }] };
    const redacted = redactSceneDataNegotiation(data) as typeof data;
    expect(redacted.motivations[0]?.description).toBe('');
  });
});

describe('redactStateForPlayer', () => {
  function baseState(): SessionState {
    return {
      sessionId: 's1',
      campaignId: 'c1',
      activeSceneId: 'scene-battle',
      scenes: [
        {
          id: 'scene-battle',
          name: 'Fight',
          type: 'battle',
          order_index: 0,
          data: { fog: [{ x: 0, y: 0, w: 3, h: 3 }] },
        },
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
      combat: {
        round: 1,
        activeSide: 'villains',
        firstSide: 'heroes',
        initiativeRoll: 12,
        heroEntities: ['hero'],
        villainEntities: ['mon-open', 'mon-fog'],
        actedThisRound: ['mon-fog'],
        activeEntityId: 'mon-fog',
        malice: 5,
        turnActions: {},
      },
      participants: [],
      actionLog: [
        { id: 'l1', sceneType: 'battle', actorId: 'mon-fog', actorName: 'Hidden Ogre', title: 'Hidden Ogre used Smash', timestamp: 1 },
        { id: 'l2', sceneType: 'battle', actorId: 'hero', actorName: 'Hero', title: 'Hero used Strike on Hidden Ogre', timestamp: 2 },
      ],
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

  it('removes fog-hidden non-hero entities, keeping heroes and visible monsters', () => {
    const ids = redactStateForPlayer(baseState()).entities.map((e) => e.id);
    expect(ids).toContain('hero');
    expect(ids).toContain('mon-open');
    expect(ids).not.toContain('mon-fog');
  });

  it('redacts negotiation secrets in both live state and scene data', () => {
    const player = redactStateForPlayer(baseState());
    expect(player.negotiation?.motivations[0]?.description).toBe('');
    const negScene = player.scenes.find((s) => s.id === 'scene-neg');
    const template = negScene?.data?.['template'] as { motivations: Array<{ description: string }> };
    expect(template.motivations[0]?.description).toBe('');
  });

  it('filters the combat roster to match the visible entities', () => {
    const player = redactStateForPlayer(baseState());
    expect(player.combat?.villainEntities).toEqual(['mon-open']);
    expect(player.combat?.actedThisRound).toEqual([]);
    expect(player.combat?.activeEntityId).toBeNull();
  });

  it('drops log entries authored by a hidden entity and masks its name elsewhere', () => {
    const player = redactStateForPlayer(baseState());
    expect(player.actionLog.map((e) => e.id)).toEqual(['l2']);
    expect(player.actionLog[0]?.title).toBe('Hero used Strike on Something');
  });

  it('does not mutate the original director state', () => {
    const state = baseState();
    redactStateForPlayer(state);
    expect(state.entities.map((e) => e.id)).toContain('mon-fog');
    expect(state.negotiation?.motivations[0]?.description).toBe('SECRET');
    expect(state.combat?.villainEntities).toEqual(['mon-open', 'mon-fog']);
    expect(state.actionLog).toHaveLength(2);
  });
});
