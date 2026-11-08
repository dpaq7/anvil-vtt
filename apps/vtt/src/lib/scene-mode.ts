import type { SceneType } from '@anvil/ui';
import type { SceneRef } from '../types/protocol.js';

/* The mode word under each Film Strip board and on the title card (DESIGN.md 2.2). */
export const MODE_WORD: Record<SceneType, string> = {
  story: 'Story',
  montage: 'Montage',
  negotiation: 'Negotiation',
  battle: 'Battle',
  respite: 'Respite',
};

export function sceneTypeOf(scene: Pick<SceneRef, 'type'> | null | undefined): SceneType {
  const type = scene?.type;
  return type && type in MODE_WORD ? (type as SceneType) : 'story';
}

export function modeWord(type: SceneType): string {
  return MODE_WORD[type];
}

