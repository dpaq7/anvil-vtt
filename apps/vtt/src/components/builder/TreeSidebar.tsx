import { useCallback, useEffect, useState, type DragEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { SceneTypeIcon, SCENE_COLORS, cn, type SceneType } from '@anvil/ui';
import { FileTreeRoot, FileTreeFolder, FileTreeFile } from './FileTree.js';

interface TreeNode {
  id: string;
  label: string;
  type: 'campaign' | 'module' | 'session' | 'scene';
  sceneType?: string;
  sessionId?: string;
  children?: TreeNode[];
}

interface TreeSidebarProps {
  nodes: TreeNode[];
  selectedId: string | null;
  onSelect: (id: string, type: TreeNode['type']) => void;
  onDeleteScene?: (sceneId: string) => void;
  onMoveScene?: (sceneId: string, targetSessionId: string) => void;
}

interface SceneContextMenuState {
  x: number;
  y: number;
  sceneId: string;
  label: string;
}

interface SceneMenuActionProps {
  children: ReactNode;
  destructive?: boolean;
  onClick: () => void;
}

function SceneMenuAction({ children, destructive, onClick }: SceneMenuActionProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors',
        'text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800',
        destructive && 'text-red-400 hover:text-red-400 focus:text-red-400',
      )}
    >
      {children}
    </button>
  );
}

function SceneContextMenu({
  state,
  onClose,
  onDeleteScene,
}: {
  state: SceneContextMenuState | null;
  onClose: () => void;
  onDeleteScene: (sceneId: string) => void;
}) {
  useEffect(() => {
    if (!state) return undefined;

    const close = () => onClose();
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('pointerdown', close);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state, onClose]);

  if (!state) return null;

  return (
    <div
      role="menu"
      aria-label={`Scene actions for ${state.label}`}
      className="fixed z-[100] w-48 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 p-1 text-zinc-100 shadow-xl shadow-black/40"
      style={{ left: state.x, top: state.y }}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <SceneMenuAction destructive onClick={() => onDeleteScene(state.sceneId)}>
        <Trash2 className="mr-2 size-4" />
        Delete Scene
      </SceneMenuAction>
    </div>
  );
}

export function TreeSidebar({ nodes, selectedId, onSelect, onDeleteScene, onMoveScene }: TreeSidebarProps) {
  const [contextMenu, setContextMenu] = useState<SceneContextMenuState | null>(null);
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);
  const [dragOverSessionId, setDragOverSessionId] = useState<string | null>(null);
  const closeSceneContextMenu = useCallback(() => setContextMenu(null), []);

  const findNode = useCallback(
    (id: string) => {
      const search = (items: TreeNode[]): TreeNode | undefined => {
        for (const node of items) {
          if (node.id === id) return node;
          if (node.children) {
            const found = search(node.children);
            if (found) return found;
          }
        }
        return undefined;
      };
      return search(nodes);
    },
    [nodes],
  );

  const handleSelect = (id: string) => {
    const node = findNode(id);
    if (node) {
      onSelect(id, node.type);
    }
  };

  const openSceneContextMenu = useCallback(
    (event: MouseEvent | KeyboardEvent, node: TreeNode) => {
      if (!onDeleteScene) return;
      event.preventDefault();
      event.stopPropagation();
      onSelect(node.id, node.type);

      if ('clientX' in event && event.clientX !== 0) {
        setContextMenu({ x: event.clientX, y: event.clientY, sceneId: node.id, label: node.label });
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      setContextMenu({ x: rect.left + 16, y: rect.top + 16, sceneId: node.id, label: node.label });
    },
    [onDeleteScene, onSelect],
  );

  const handleSceneKeyDown = useCallback(
    (event: KeyboardEvent, node: TreeNode) => {
      if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
      openSceneContextMenu(event, node);
    },
    [openSceneContextMenu],
  );

  const handleDeleteScene = useCallback(
    (sceneId: string) => {
      setContextMenu(null);
      onDeleteScene?.(sceneId);
    },
    [onDeleteScene],
  );

  return (
    <nav className="flex flex-col gap-1 p-2">
      <FileTreeRoot selectedId={selectedId} onSelect={handleSelect}>
        {nodes.map((node) => (
          <TreeNodeRenderer
            key={node.id}
            node={node}
            depth={0}
            draggedSceneId={draggedSceneId}
            dragOverSessionId={dragOverSessionId}
            onSceneContextMenu={openSceneContextMenu}
            onSceneKeyDown={handleSceneKeyDown}
            onSceneDragStart={(event, sceneId) => {
              setDraggedSceneId(sceneId);
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('application/x-anvil-scene-id', sceneId);
            }}
            onSceneDragEnd={() => {
              setDraggedSceneId(null);
              setDragOverSessionId(null);
            }}
            onSessionDragOver={(event, sessionId) => {
              const hasScenePayload = Array.from(event.dataTransfer.types).includes('application/x-anvil-scene-id');
              if (!onMoveScene || (!draggedSceneId && !hasScenePayload)) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              setDragOverSessionId(sessionId);
            }}
            onSessionDragLeave={(event, sessionId) => {
              if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
              setDragOverSessionId((current) => (current === sessionId ? null : current));
            }}
            onSessionDrop={(event, sessionId) => {
              if (!onMoveScene) return;
              event.preventDefault();
              const sceneId = draggedSceneId ?? event.dataTransfer.getData('application/x-anvil-scene-id');
              setDraggedSceneId(null);
              setDragOverSessionId(null);
              if (sceneId) onMoveScene(sceneId, sessionId);
            }}
          />
        ))}
      </FileTreeRoot>
      <SceneContextMenu
        state={contextMenu}
        onClose={closeSceneContextMenu}
        onDeleteScene={handleDeleteScene}
      />
    </nav>
  );
}

function TreeNodeRenderer({
  node,
  depth,
  draggedSceneId,
  dragOverSessionId,
  onSceneContextMenu,
  onSceneKeyDown,
  onSceneDragStart,
  onSceneDragEnd,
  onSessionDragOver,
  onSessionDragLeave,
  onSessionDrop,
}: {
  node: TreeNode;
  depth: number;
  draggedSceneId: string | null;
  dragOverSessionId: string | null;
  onSceneContextMenu: (event: MouseEvent, node: TreeNode) => void;
  onSceneKeyDown: (event: KeyboardEvent, node: TreeNode) => void;
  onSceneDragStart: (event: DragEvent<HTMLDivElement>, sceneId: string) => void;
  onSceneDragEnd: () => void;
  onSessionDragOver: (event: DragEvent<HTMLDivElement>, sessionId: string) => void;
  onSessionDragLeave: (event: DragEvent<HTMLDivElement>, sessionId: string) => void;
  onSessionDrop: (event: DragEvent<HTMLDivElement>, sessionId: string) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;

  // Scenes are leaf nodes (files)
  if (node.type === 'scene') {
    const sceneType = node.sceneType as SceneType | undefined;
    return (
      <div
        draggable
        onContextMenu={(event) => onSceneContextMenu(event, node)}
        onKeyDown={(event) => onSceneKeyDown(event, node)}
        onDragStart={(event) => onSceneDragStart(event, node.id)}
        onDragEnd={onSceneDragEnd}
        className={cn(draggedSceneId === node.id && 'opacity-50')}
      >
        <FileTreeFile
          id={node.id}
          label={node.label}
          depth={depth}
          icon={sceneType ? <SceneTypeIcon type={sceneType} className="size-4" /> : undefined}
          colorClass={sceneType ? SCENE_COLORS[sceneType] : undefined}
        />
      </div>
    );
  }

  // Campaigns, modules, and sessions are folder nodes
  const isSessionDropTarget = node.type === 'session' && dragOverSessionId === node.id;
  return (
    <div
      onDragOver={node.type === 'session' ? (event) => onSessionDragOver(event, node.id) : undefined}
      onDragLeave={node.type === 'session' ? (event) => onSessionDragLeave(event, node.id) : undefined}
      onDrop={node.type === 'session' ? (event) => onSessionDrop(event, node.id) : undefined}
      className={cn(isSessionDropTarget && 'rounded-md ring-1 ring-sidebar-director/70')}
    >
      <FileTreeFolder
        id={node.id}
        label={node.label}
        depth={depth}
        defaultOpen={node.type === 'campaign'}
      >
        {hasChildren &&
          node.children!.map((child) => (
            <TreeNodeRenderer
              key={child.id}
              node={child}
              depth={depth + 1}
              draggedSceneId={draggedSceneId}
              dragOverSessionId={dragOverSessionId}
              onSceneContextMenu={onSceneContextMenu}
              onSceneKeyDown={onSceneKeyDown}
              onSceneDragStart={onSceneDragStart}
              onSceneDragEnd={onSceneDragEnd}
              onSessionDragOver={onSessionDragOver}
              onSessionDragLeave={onSessionDragLeave}
              onSessionDrop={onSessionDrop}
            />
          ))}
      </FileTreeFolder>
    </div>
  );
}
