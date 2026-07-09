import { cn } from '../lib/utils.js';

export type SceneType = 'story' | 'battle' | 'montage' | 'negotiation' | 'respite';

const SCENE_ICONS: Record<SceneType, string> = {
  story: '\u{1F4D6}',
  battle: '\u{2694}\uFE0F',
  montage: '\u{1F3AC}',
  negotiation: '\u{1F91D}',
  respite: '\u{1F3D5}\uFE0F',
};

// Aligned with the scene tokens in globals.css and Badge variants:
// story = purple, negotiation = blue.
export const SCENE_COLORS: Record<SceneType, string> = {
  story: 'text-purple-400',
  battle: 'text-red-400',
  montage: 'text-amber-400',
  negotiation: 'text-blue-400',
  respite: 'text-emerald-400',
};

export const SCENE_BG_COLORS: Record<SceneType, string> = {
  story: 'bg-purple-500/20',
  battle: 'bg-red-500/20',
  montage: 'bg-amber-500/20',
  negotiation: 'bg-blue-500/20',
  respite: 'bg-emerald-500/20',
};

export const SCENE_BORDER_COLORS: Record<SceneType, string> = {
  story: 'border-purple-500/40',
  battle: 'border-red-500/40',
  montage: 'border-amber-500/40',
  negotiation: 'border-blue-500/40',
  respite: 'border-emerald-500/40',
};

export interface SceneTypeIconProps {
  type: SceneType;
  className?: string;
}

export function SceneTypeIcon({ type, className }: SceneTypeIconProps) {
  return (
    <span className={cn(SCENE_COLORS[type], className)} role="img" aria-label={type}>
      {SCENE_ICONS[type]}
    </span>
  );
}
