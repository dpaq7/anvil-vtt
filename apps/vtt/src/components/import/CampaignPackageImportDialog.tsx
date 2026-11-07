import { useRef, useState } from 'react';
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger } from '@anvil/ui';
import type { CampaignPackageImportResult } from '@anvil/types';
import { importCampaignPackage, parseCampaignPackage } from '../../lib/campaign-package.js';

interface Props {
  onImported: (result: CampaignPackageImportResult) => void | Promise<void>;
  compact?: boolean;
}

export function CampaignPackageImportDialog({ onImported, compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError('');
    setProgress('Verifying package…');
    try {
      const parsed = await parseCampaignPackage(file);
      const result = await importCampaignPackage(parsed, (complete, total, name) => {
        setProgress(total > 0 ? `Uploading ${complete}/${total}: ${name}` : name);
      });
      await onImported(result);
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Campaign import failed.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!busy) setOpen(value); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size={compact ? 'sm' : undefined}>{compact ? 'Import' : 'Import Campaign'}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Import Complete Campaign</DialogTitle>
        <p className="mt-2 text-sm text-zinc-400">
          Choose an Anvil .cam package. Its manifest, scenes, maps, tokens, handouts, portraits, and other assets will be verified before import.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".cam,application/zip"
          className="hidden"
          onChange={(event) => { void choose(event.target.files?.[0]); }}
        />
        {progress && busy && <p className="mt-4 text-sm text-zinc-300">{progress}</p>}
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        <div className="mt-5 flex justify-end">
          <Button disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? 'Importing…' : 'Choose .cam File'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
