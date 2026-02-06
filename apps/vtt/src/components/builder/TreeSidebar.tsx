import { SceneTypeIcon, SCENE_COLORS, type SceneType } from '@anvil/ui';
import { FileTreeRoot, FileTreeFolder, FileTreeFile } from './FileTree.js';

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
  const handleSelect = (id: string) => {
    // Find the node to get its type
    const findNode = (nodes: TreeNode[]): TreeNode | undefined => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return undefined;
    };

    const node = findNode(nodes);
    if (node) {
      onSelect(id, node.type);
    }
  };

  return (
    <nav className="flex flex-col gap-1 p-2">
      <FileTreeRoot selectedId={selectedId} onSelect={handleSelect}>
        {nodes.map((node) => (
          <TreeNodeRenderer key={node.id} node={node} depth={0} />
        ))}
      </FileTreeRoot>
    </nav>
  );
}

function TreeNodeRenderer({ node, depth }: { node: TreeNode; depth: number }) {
  const hasChildren = node.children && node.children.length > 0;

  // Scenes are leaf nodes (files)
  if (node.type === 'scene') {
    const sceneType = node.sceneType as SceneType | undefined;
    return (
      <FileTreeFile
        id={node.id}
        label={node.label}
        depth={depth}
        icon={sceneType ? <SceneTypeIcon type={sceneType} className="size-4" /> : undefined}
        colorClass={sceneType ? SCENE_COLORS[sceneType] : undefined}
      />
    );
  }

  // Campaigns, modules, and sessions are folder nodes
  return (
    <FileTreeFolder
      id={node.id}
      label={node.label}
      depth={depth}
      defaultOpen={node.type === 'campaign'}
    >
      {hasChildren &&
        node.children!.map((child) => (
          <TreeNodeRenderer key={child.id} node={child} depth={depth + 1} />
        ))}
    </FileTreeFolder>
  );
}
