/**
 * The on-disk Forge Steel character format is the raw Hero JSON object exported
 * by Forge Steel as .ds-hero (legacy .drawsteel-hero is also accepted).
 * Nested rules objects intentionally remain open: Forge Steel embeds sourcebook
 * definitions and adds fields over time. Anvil keeps only the mapped fields.
 */
export interface ForgeSteelHeroFile {
  id: string;
  name: string;
  picture: string | null;
  folder: string;
  /** Forge Steel 14+ sourcebook references. */
  sourcebookIDs?: string[];
  /** Legacy Forge Steel sourcebook references. */
  settingIDs?: string[];
  ancestry: ForgeSteelNamedElement | null;
  culture: ForgeSteelNamedElement | null;
  career: ForgeSteelNamedElement | null;
  class: (ForgeSteelNamedElement & {
    level?: number;
    characteristics?: Array<{ characteristic: string; value: number }>;
    subclasses?: Array<ForgeSteelNamedElement & { selected?: boolean }>;
  }) | null;
  complication: ForgeSteelNamedElement | null;
  features: unknown[];
  state: {
    staminaDamage?: number;
    staminaTemp?: number;
    recoveriesUsed?: number;
    surges?: number;
    victories?: number;
    xp?: number;
    heroTokens?: number;
    renown?: number;
    wealth?: number;
    projectPoints?: number;
    conditions?: unknown[];
    inventory?: unknown[];
    projects?: unknown[];
    tutorialMode?: unknown;
    titles?: unknown[];
    notes?: string;
    [key: string]: unknown;
  };
  abilityCustomizations: unknown[];
  isActive?: boolean;
  [key: string]: unknown;
}

export interface ForgeSteelNamedElement {
  id?: string;
  name: string;
  [key: string]: unknown;
}

export interface ForgeSteelHeroImportRequest {
  hero: ForgeSteelHeroFile;
  portraitAssetId?: string | null;
}

export interface ForgeSteelHeroImportResult {
  id: string;
  name: string;
  warnings: string[];
}
