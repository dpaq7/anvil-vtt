import { Users, UserCircle, Image, Map, Skull, Mountain, Music } from 'lucide-react';
import { Badge } from '@anvil/ui';
import { FileTreeRoot, FileTreeFile } from '../builder/FileTree.js';
import type { AssetFolder } from '@anvil/types';
import type { ReactNode } from 'react';

const FOLDER_CONFIG: Array<{
  id: AssetFolder;
  label: string;
  icon: ReactNode;
}> = [
  { id: 'heroes', label: 'Heroes', icon: <Users className="size-4 shrink-0" /> },
  { id: 'npcs', label: 'NPCs', icon: <UserCircle className="size-4 shrink-0" /> },
  { id: 'pictures', label: 'Pictures', icon: <Image className="size-4 shrink-0" /> },
  { id: 'maps', label: 'Maps', icon: <Map className="size-4 shrink-0" /> },
  { id: 'bestiary', label: 'Bestiary', icon: <Skull className="size-4 shrink-0" /> },
  { id: 'terrain', label: 'Terrain', icon: <Mountain className="size-4 shrink-0" /> },
  { id: 'audio', label: 'Audio', icon: <Music className="size-4 shrink-0" /> },
];

export interface AssetTreeSidebarProps {
  selectedFolder: AssetFolder;
  onSelect: (folder: AssetFolder) => void;
  counts: Record<AssetFolder, number>;
}

export function AssetTreeSidebar({ selectedFolder, onSelect, counts }: AssetTreeSidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r border-zinc-800 bg-zinc-950 p-2">
      <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Assets
      </h2>
      <FileTreeRoot
        selectedId={selectedFolder}
        onSelect={(id) => onSelect(id as AssetFolder)}
        className="flex-1"
      >
        {FOLDER_CONFIG.map((folder) => (
          <div key={folder.id} className="flex items-center">
            <FileTreeFile
              id={folder.id}
              label={folder.label}
              icon={folder.icon}
              depth={0}
            />
            {counts[folder.id] > 0 && (
              <Badge variant="secondary" className="mr-2 ml-auto text-[10px] px-1.5 py-0">
                {counts[folder.id]}
              </Badge>
            )}
          </div>
        ))}
      </FileTreeRoot>
    </div>
  );
}
