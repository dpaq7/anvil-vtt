import { BattleCanvas } from '../../canvas/BattleCanvas.js';
import type { EntityData, CombatState, ClientMessage } from '../../types/protocol.js';

interface BattleStageProps {
  entities: EntityData[];
  combat: CombatState | null;
  selectedEntityId: string | null;
  isDirector: boolean;
  cols?: number;
  rows?: number;
  cellSize?: number;
  backgroundUrl?: string | null;
  heroPosition?: { x: number; y: number } | null;
  onSelectEntity: (entityId: string | null) => void;
  send: (msg: ClientMessage) => void;
}

export function BattleStage({
  entities,
  selectedEntityId,
  isDirector,
  cols = 30,
  rows = 20,
  cellSize = 64,
  backgroundUrl,
  heroPosition,
  onSelectEntity,
  send,
}: BattleStageProps) {
  const handleMoveEntity = (entityId: string, x: number, y: number) => {
    send({ type: 'move_token', entityId, x, y });
  };

  return (
    <div className="relative h-full w-full">
      <BattleCanvas
        cols={cols}
        rows={rows}
        cellSize={cellSize}
        entities={entities}
        selectedEntityId={selectedEntityId}
        backgroundUrl={backgroundUrl}
        isDirector={isDirector}
        heroPosition={heroPosition}
        onSelectEntity={onSelectEntity}
        onMoveEntity={handleMoveEntity}
      />
    </div>
  );
}
