/**
 * Pre-Generated Scene Types
 *
 * Types for pre-built encounter templates from official Draw Steel content.
 */

import type {
  SceneType,
  BattleSceneTemplate,
  MontageSceneTemplate,
  NegotiationSceneTemplate,
  StorySceneTemplate,
  RespiteSceneTemplate,
  SceneDifficulty,
} from '@anvil/types';

/**
 * Pre-gen scene category
 */
export type PregenCategory = 'official' | 'community' | 'custom';

/**
 * Base pre-gen scene metadata
 */
export interface PregenSceneBase {
  /** Unique identifier */
  id: string;
  /** Scene type */
  type: SceneType;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Source attribution */
  source: string;
  /** Category */
  category: PregenCategory;
  /** Recommended party size */
  partySize?: number;
  /** Recommended party level */
  partyLevel?: number;
  /** Difficulty rating */
  difficulty?: SceneDifficulty;
  /** Tags for filtering */
  tags?: string[];
}

/**
 * Pre-gen battle scene
 */
export interface PregenBattleScene extends PregenSceneBase {
  type: 'battle';
  template: BattleSceneTemplate;
}

/**
 * Pre-gen montage scene
 */
export interface PregenMontageScene extends PregenSceneBase {
  type: 'montage';
  template: MontageSceneTemplate;
}

/**
 * Pre-gen negotiation scene
 */
export interface PregenNegotiationScene extends PregenSceneBase {
  type: 'negotiation';
  template: NegotiationSceneTemplate;
}

/**
 * Pre-gen story scene
 */
export interface PregenStoryScene extends PregenSceneBase {
  type: 'story';
  template: StorySceneTemplate;
}

/**
 * Pre-gen respite scene
 */
export interface PregenRespiteScene extends PregenSceneBase {
  type: 'respite';
  template: RespiteSceneTemplate;
}

/**
 * Union type for all pre-gen scenes
 */
export type PregenScene =
  | PregenBattleScene
  | PregenMontageScene
  | PregenNegotiationScene
  | PregenStoryScene
  | PregenRespiteScene;

/**
 * Type guard for battle scenes
 */
export function isPregenBattleScene(scene: PregenScene): scene is PregenBattleScene {
  return scene.type === 'battle';
}

/**
 * Type guard for montage scenes
 */
export function isPregenMontageScene(scene: PregenScene): scene is PregenMontageScene {
  return scene.type === 'montage';
}

/**
 * Type guard for negotiation scenes
 */
export function isPregenNegotiationScene(scene: PregenScene): scene is PregenNegotiationScene {
  return scene.type === 'negotiation';
}

/**
 * Type guard for story scenes
 */
export function isPregenStoryScene(scene: PregenScene): scene is PregenStoryScene {
  return scene.type === 'story';
}

/**
 * Type guard for respite scenes
 */
export function isPregenRespiteScene(scene: PregenScene): scene is PregenRespiteScene {
  return scene.type === 'respite';
}
