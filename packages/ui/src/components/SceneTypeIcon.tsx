import { BookOpen, Footprints, Handshake, Swords, Tent, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils.js';
import { SCENE_COLORS, type SceneType } from './scene-type.js';

/* Mode icons (DESIGN.md 2.2). Sized by font size, so text-* classes still scale them. */
const SCENE_ICONS: Record<SceneType, LucideIcon> = {
  story: BookOpen,
  battle: Swords,
  montage: Footprints,
  negotiation: Handshake,
  respite: Tent,
};

export interface SceneTypeIconProps {
  type: SceneType;
  className?: string;
}

export function SceneTypeIcon({ type, className }: SceneTypeIconProps) {
  const Icon = SCENE_ICONS[type];
  return (
    <span
      className={cn('inline-flex items-center justify-center', SCENE_COLORS[type], className)}
      role="img"
      aria-label={type}
    >
      <Icon className="size-[1em] shrink-0" strokeWidth={2.6} aria-hidden="true" />
    </span>
  );
}
