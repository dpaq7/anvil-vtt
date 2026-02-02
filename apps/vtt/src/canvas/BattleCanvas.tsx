import { useEffect, useRef, useCallback } from 'react';
import { Application, Container } from 'pixi.js';
import { BackgroundLayer } from './layers/BackgroundLayer.js';
import { GridLayer } from './layers/GridLayer.js';
import { TokenLayer } from './layers/TokenLayer.js';
import { FogLayer } from './layers/FogLayer.js';
import { ViewportSystem } from './systems/ViewportSystem.js';
import { InteractionManager } from './systems/InteractionManager.js';
import { computeVisibility } from './vision/VisibilityCalculator.js';
import type { Segment } from './vision/VisibilityCalculator.js';
import type { EntityData } from '../types/protocol.js';

export interface BattleCanvasProps {
  cols: number;
  rows: number;
  cellSize: number;
  entities: EntityData[];
  selectedEntityId: string | null;
  backgroundUrl?: string | null;
  walls?: Segment[];
  isDirector: boolean;
  heroPosition?: { x: number; y: number } | null;
  onSelectEntity: (entityId: string | null) => void;
  onMoveEntity: (entityId: string, x: number, y: number) => void;
}

export function BattleCanvas({
  cols,
  rows,
  cellSize,
  entities,
  selectedEntityId,
  backgroundUrl,
  walls = [],
  isDirector,
  heroPosition,
  onSelectEntity,
  onMoveEntity,
}: BattleCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const layersRef = useRef<{
    background: BackgroundLayer;
    grid: GridLayer;
    tokens: TokenLayer;
    fog: FogLayer;
    world: Container;
    viewport: ViewportSystem;
    interaction: InteractionManager;
  } | null>(null);

  // Init PixiJS
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const app = new Application();
    let mounted = true;

    void app.init({
      resizeTo: el,
      backgroundColor: 0x1a1a2e,
      antialias: true,
    }).then(() => {
      if (!mounted) return;

      el.appendChild(app.canvas as HTMLCanvasElement);
      appRef.current = app;

      const world = new Container();
      app.stage.addChild(world);

      const background = new BackgroundLayer();
      const grid = new GridLayer();
      const tokens = new TokenLayer();
      const fog = new FogLayer();

      world.addChild(background);
      world.addChild(grid);
      world.addChild(tokens);
      world.addChild(fog);

      const viewport = new ViewportSystem(world, app.canvas as HTMLCanvasElement);
      const interaction = new InteractionManager(
        app.canvas as HTMLCanvasElement,
        viewport,
        tokens,
        cellSize,
        { onTokenSelect: onSelectEntity, onTokenMove: onMoveEntity },
        isDirector,
      );

      tokens.setCellSize(cellSize);
      grid.draw({ cellSize, cols, rows });
      fog.setMapSize(cols * cellSize, rows * cellSize);

      layersRef.current = { background, grid, tokens, fog, world, viewport, interaction };
    });

    return () => {
      mounted = false;
      layersRef.current?.viewport.destroy();
      layersRef.current?.interaction.destroy();
      layersRef.current = null;
      appRef.current?.destroy(true);
      appRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update background
  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;
    if (backgroundUrl) {
      layers.background.setImage(backgroundUrl, cols * cellSize, rows * cellSize);
    } else {
      layers.background.setColor(0x1a1a2e, cols * cellSize, rows * cellSize);
    }
  }, [backgroundUrl, cols, rows, cellSize]);

  // Update tokens
  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;

    // Simple reconciliation — clear and re-add
    for (const entity of entities) {
      const color = entity.type === 'hero' ? 0x3b82f6 : entity.type === 'monster' ? 0xef4444 : 0x8b5cf6;
      layers.tokens.addToken(entity, {
        size: 1,
        color,
        selected: entity.id === selectedEntityId,
      });
    }

    layers.interaction.rebuildIndex();
  }, [entities, selectedEntityId]);

  // Update fog
  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;

    if (isDirector) {
      layers.fog.hideFog();
      return;
    }

    layers.fog.showFog();
    if (heroPosition) {
      const origin = {
        x: heroPosition.x * cellSize + cellSize / 2,
        y: heroPosition.y * cellSize + cellSize / 2,
      };
      const polygon = computeVisibility(origin, walls, {
        width: cols * cellSize,
        height: rows * cellSize,
      });
      layers.fog.drawFog(polygon);
    } else {
      layers.fog.drawFog(null);
    }
  }, [isDirector, heroPosition, walls, cols, rows, cellSize]);

  return (
    <div ref={containerRef} className="h-full w-full" />
  );
}
