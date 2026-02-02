import { cn } from '@anvil/ui';

interface TreeNode {
  id: string;
  label: string;
  type: 'campaign' | 'module' | 'session' | 'scene';
  sceneType?: string;
  children?: TreeNode[];
}

interface TreeSidebarProps {
  nodes: TreeNode[];
  selectedId: string | null;
  onSelect: (id: string, type: TreeNode['type']) => void;
}

export function TreeSidebar({ nodes, selectedId, onSelect }: TreeSidebarProps) {
  return (
    <nav className="flex flex-col gap-1 p-2">
      {nodes.map((node) => (
        <TreeItem key={node.id} node={node} selectedId={selectedId} onSelect={onSelect} depth={0} />
      ))}
    </nav>
  );
}

function TreeItem({
  node,
  selectedId,
  onSelect,
  depth,
}: {
  node: TreeNode;
  selectedId: string | null;
  onSelect: (id: string, type: TreeNode['type']) => void;
  depth: number;
}) {
  const sceneColors: Record<string, string> = {
    battle: 'text-red-400',
    story: 'text-purple-400',
    montage: 'text-amber-400',
    negotiation: 'text-blue-400',
    respite: 'text-green-400',
  };

  return (
    <div>
      <button
        onClick={() => onSelect(node.id, node.type)}
        className={cn(
          'w-full rounded px-2 py-1 text-left text-sm transition hover:bg-zinc-800',
          selectedId === node.id && 'bg-zinc-800 text-zinc-100',
          selectedId !== node.id && 'text-zinc-400',
          node.sceneType && sceneColors[node.sceneType],
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {node.label}
      </button>
      {node.children?.map((child) => (
        <TreeItem key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
      ))}
    </div>
  );
}
