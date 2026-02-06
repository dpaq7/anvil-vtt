import { useState, useCallback, useEffect, useRef } from 'react';
import { Minus, Plus, Trash2, Check, X } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Progress,
  Textarea,
} from '@anvil/ui';
import type { ActivityCard, UpdateActivityCardInput } from '@anvil/types';

export interface RespiteActivityCardProps {
  card: ActivityCard;
  onUpdate: (input: UpdateActivityCardInput) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function RespiteActivityCard({
  card,
  onUpdate,
  onDelete,
}: RespiteActivityCardProps) {
  const [notes, setNotes] = useState(card.notes ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync notes from prop
  useEffect(() => {
    setNotes(card.notes ?? '');
  }, [card.notes]);

  // Debounced notes save
  const handleNotesChange = useCallback(
    (value: string) => {
      setNotes(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onUpdate({ notes: value || null });
      }, 500);
    },
    [onUpdate],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleAdjustPoints = useCallback(
    (delta: number) => {
      const newPoints = Math.max(0, card.pointsSpent + delta);
      if (card.pointsTotal !== null) {
        onUpdate({ pointsSpent: Math.min(newPoints, card.pointsTotal) });
      } else {
        onUpdate({ pointsSpent: newPoints });
      }
    },
    [card.pointsSpent, card.pointsTotal, onUpdate],
  );

  const handleToggleActive = useCallback(() => {
    onUpdate({ isActive: !card.isActive });
  }, [card.isActive, onUpdate]);

  const progressPercent =
    card.pointsTotal !== null && card.pointsTotal > 0
      ? Math.floor((card.pointsSpent / card.pointsTotal) * 100)
      : 0;

  const isComplete =
    card.pointsTotal !== null && card.pointsSpent >= card.pointsTotal;

  // Activity type badge color
  const typeBadgeClass = (() => {
    switch (card.activityType) {
      case 'recover':
        return 'bg-green-600/20 text-green-400';
      case 'craft':
        return 'bg-amber-600/20 text-amber-400';
      case 'research':
        return 'bg-blue-600/20 text-blue-400';
      case 'socialize':
        return 'bg-purple-600/20 text-purple-400';
      case 'change_kit':
        return 'bg-orange-600/20 text-orange-400';
      case 'project':
        return 'bg-cyan-600/20 text-cyan-400';
      default:
        return 'bg-zinc-600/20 text-zinc-400';
    }
  })();

  return (
    <Card className={!card.isActive ? 'opacity-50' : undefined}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 p-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <CardTitle className="truncate text-xs font-bold">
              {card.activityName}
            </CardTitle>
            <Badge
              className={`border-transparent text-[9px] px-1 py-0 ${typeBadgeClass}`}
            >
              {card.activityType.replace('_', ' ')}
            </Badge>
            {isComplete && (
              <Badge className="border-transparent bg-green-600/20 text-[9px] px-1 py-0 text-green-400">
                Complete
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Toggle active/completed */}
          <Button
            variant="ghost"
            size="sm"
            className="size-6 p-0"
            onClick={handleToggleActive}
            title={card.isActive ? 'Mark completed' : 'Mark active'}
          >
            <Check className={`size-3 ${card.isActive ? 'text-zinc-500' : 'text-green-400'}`} />
          </Button>

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="size-6 p-0 text-red-400 hover:text-red-300"
                onClick={onDelete}
              >
                <Check className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="size-6 p-0"
                onClick={() => setConfirmDelete(false)}
              >
                <X className="size-3" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="size-6 p-0 text-zinc-500 hover:text-red-400"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2 px-3 pb-3 pt-0">
        {/* Points progress (for project-type activities) */}
        {card.pointsTotal !== null && card.pointsTotal > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400">
                {card.pointsSpent} / {card.pointsTotal} points
              </span>
              <span className="text-[10px] text-zinc-500">
                {progressPercent}%
              </span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="size-6 p-0"
                onClick={() => handleAdjustPoints(-1)}
                disabled={card.pointsSpent <= 0}
              >
                <Minus className="size-3" />
              </Button>
              <span className="min-w-[3ch] text-center text-xs font-medium text-zinc-300">
                {card.pointsSpent}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="size-6 p-0"
                onClick={() => handleAdjustPoints(1)}
                disabled={isComplete}
              >
                <Plus className="size-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Notes */}
        <Textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Notes..."
          className="min-h-[48px] text-xs"
          rows={2}
        />
      </CardContent>
    </Card>
  );
}
