import { cn } from '../lib/utils.js';
import { SCENE_COLORS, type SceneType } from './scene-type.js';

const SCENE_ICONS: Record<SceneType, string> = {
  story: '\u{1F4D6}',
  battle: '\u{2694}\uFE0F',
  montage: '\u{1F3AC}',
  negotiation: '\u{1F91D}',
  respite: '\u{1F3D5}\uFE0F',
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
