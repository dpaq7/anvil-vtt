import { useRef, useState } from 'react';
import { FileJson, PackagePlus, Upload } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger } from '@anvil/ui';
import { MCDM_DRAW_STEEL_DEMO_CAMPAIGN } from '@anvil/data';
import type { SceneImportDocument } from '@anvil/types';

interface SceneImportDialogProps {
  buttonLabel?: string;
  onImport: (document: SceneImportDocument) => Promise<void>;
}

export function SceneImportDialog({ buttonLabel = 'Scene Import', onImport }: SceneImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const runImport = async (document: SceneImportDocument) => {
    setError(null);
    setImporting(true);
    try {
      await onImport(document);
      setOpen(false);
      setFileName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setError(null);

    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const document = parsed && typeof parsed === 'object' && 'document' in parsed
        ? (parsed as { document?: SceneImportDocument }).document
        : parsed as SceneImportDocument;
      if (!document || typeof document !== 'object') throw new Error('Import JSON must contain a scene import document');
      await runImport(document);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON file');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Upload className="size-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Scene Import</DialogTitle>
        <div className="mt-4 flex flex-col gap-3">
          <Button
            type="button"
            onClick={() => void runImport(MCDM_DRAW_STEEL_DEMO_CAMPAIGN)}
            disabled={importing}
            className="justify-start"
          >
            <PackagePlus className="size-4" />
            MCDM Draw Steel Demo Scenes
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => void handleFileSelected(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="justify-start"
          >
            <FileJson className="size-4" />
            Import JSON File
          </Button>

          {fileName ? <p className="text-xs text-zinc-500">{fileName}</p> : null}
          {error ? <p className="rounded-md border border-red-900/60 bg-red-950/30 p-2 text-sm text-red-300">{error}</p> : null}
          {importing ? <p className="text-sm text-zinc-500">Importing...</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
