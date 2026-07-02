import type { ReactNode } from 'react';
import { MonsterPortraitDialog } from './MonsterPortraitDialog.js';

export interface HeroPortraitDialogProps {
  heroName: string;
  currentPortraitUrl?: string | null;
  onSave: (assetId: string) => Promise<void>;
  onRemove?: () => Promise<void>;
  children: ReactNode;
}

export function HeroPortraitDialog({
  heroName,
  currentPortraitUrl,
  onSave,
  onRemove,
  children,
}: HeroPortraitDialogProps) {
  return (
    <MonsterPortraitDialog
      monsterName={heroName}
      currentPortraitUrl={currentPortraitUrl ?? undefined}
      onSave={onSave}
      onRemove={onRemove}
      title={`Portrait — ${heroName}`}
      uploadDescription="Upload art for this hero's portrait"
      outputFileName={`${heroName}-portrait.png`}
    >
      {children}
    </MonsterPortraitDialog>
  );
}
