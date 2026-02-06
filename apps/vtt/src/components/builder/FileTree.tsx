import { createContext, useContext, useState, type ReactNode } from 'react';
import { ChevronRight, Folder, FolderOpen, FileText } from 'lucide-react';
import { cn, Collapsible, CollapsibleTrigger, CollapsibleContent } from '@anvil/ui';

/* ------------------------------------------------------------------ */
/*  Context                                                           */
/* ------------------------------------------------------------------ */

interface FileTreeContextValue {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const FileTreeContext = createContext<FileTreeContextValue | null>(null);

function useFileTree() {
  const ctx = useContext(FileTreeContext);
  if (!ctx) throw new Error('FileTree components must be used within FileTreeRoot');
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  FileTreeRoot                                                      */
/* ------------------------------------------------------------------ */

interface FileTreeRootProps {
  children: ReactNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export function FileTreeRoot({ children, selectedId, onSelect, className }: FileTreeRootProps) {
  return (
    <FileTreeContext.Provider value={{ selectedId, onSelect }}>
      <div className={cn('flex flex-col', className)}>{children}</div>
    </FileTreeContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  FileTreeFolder                                                    */
/* ------------------------------------------------------------------ */

interface FileTreeFolderProps {
  id: string;
  label: string;
  children?: ReactNode;
  defaultOpen?: boolean;
  icon?: ReactNode;
  depth?: number;
}

export function FileTreeFolder({
  id,
  label,
  children,
  defaultOpen = false,
  icon,
  depth = 0,
}: FileTreeFolderProps) {
  const { selectedId, onSelect } = useFileTree();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isSelected = selectedId === id;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(id);
          }}
          className={cn(
            'group flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors',
            'hover:bg-zinc-800/50',
            isSelected && 'bg-zinc-800 text-zinc-100',
            !isSelected && 'text-zinc-400',
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <ChevronRight
            className={cn(
              'size-4 shrink-0 text-zinc-500 transition-transform duration-200',
              isOpen && 'rotate-90',
            )}
          />
          {icon ?? (isOpen ? (
            <FolderOpen className="size-4 shrink-0 text-zinc-500" />
          ) : (
            <Folder className="size-4 shrink-0 text-zinc-500" />
          ))}
          <span className="truncate">{label}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="relative">
          {/* Vertical indent line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-zinc-800"
            style={{ left: `${depth * 12 + 16}px` }}
          />
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ------------------------------------------------------------------ */
/*  FileTreeFile                                                      */
/* ------------------------------------------------------------------ */

interface FileTreeFileProps {
  id: string;
  label: string;
  icon?: ReactNode;
  depth?: number;
  colorClass?: string;
}

export function FileTreeFile({ id, label, icon, depth = 0, colorClass }: FileTreeFileProps) {
  const { selectedId, onSelect } = useFileTree();
  const isSelected = selectedId === id;

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        'hover:bg-zinc-800/50',
        isSelected && 'bg-zinc-800 text-zinc-100',
        !isSelected && 'text-zinc-400',
        colorClass,
      )}
      style={{ paddingLeft: `${depth * 12 + 28}px` }}
    >
      {icon ?? <FileText className="size-4 shrink-0" />}
      <span className="truncate">{label}</span>
    </button>
  );
}
