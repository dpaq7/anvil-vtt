import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@anvil/ui';

interface AssetActionMenuProps {
  label: string;
  itemName: string;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  className?: string;
}

export function AssetActionMenu({
  label,
  itemName,
  onEdit,
  onDelete,
  className,
}: AssetActionMenuProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
      setConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            className={cn(
              'size-8 border border-zinc-700/70 bg-zinc-950/80 text-zinc-300 shadow-sm shadow-black/30 hover:bg-zinc-800 hover:text-zinc-100',
              className,
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44" onClick={(event) => event.stopPropagation()}>
          <DropdownMenuItem
            onSelect={() => {
              onEdit();
            }}
            className="gap-2 text-xs"
          >
            <Pencil className="size-3.5" />
            Edit details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setError(null);
              setConfirmOpen(true);
            }}
            className="gap-2 text-xs text-red-300 focus:text-red-200"
          >
            <Trash2 className="size-3.5" />
            Delete asset
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle className="text-sm">Delete asset?</DialogTitle>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Delete <span className="font-medium text-zinc-200">{itemName}</span>. This cannot be undone.
          </p>
          {error && (
            <p className="mt-3 rounded-md border border-red-900/60 bg-red-950/20 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm" disabled={deleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
