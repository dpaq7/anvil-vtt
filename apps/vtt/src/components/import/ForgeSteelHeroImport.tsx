import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button, cn } from '@anvil/ui';
import type { ForgeSteelHeroImportResult } from '@anvil/types';
import { importForgeSteelHero } from '../../lib/forge-steel.js';

interface Props {
  onImported: (result: ForgeSteelHeroImportResult) => void | Promise<void>;
  presentation?: 'button' | 'wizard';
  className?: string;
}

export function ForgeSteelHeroImport({ onImported, presentation = 'button', className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const choose = async (file: File | undefined) => {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    try {
      await onImported(await importForgeSteelHero(file));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Forge Steel hero import failed.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const picker = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".ds-hero,.drawsteel-hero,application/json"
        className="hidden"
        onChange={(event) => { void choose(event.target.files?.[0]); }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-2 size-4" />
        {busy ? 'Importing Hero…' : 'Upload .ds-hero'}
      </Button>
    </>
  );

  if (presentation === 'wizard') {
    return (
      <div className={cn('mb-6 rounded-lg border border-creator-highlight/40 bg-creator-highlight/10 p-4', className)}>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-semibold text-creator-text">Already have a complete hero?</h3>
            <p className="mt-1 text-xs text-creator-text-muted">
              Upload a Forge Steel `.ds-hero` file to skip character creation and open the imported sheet.
            </p>
          </div>
          <div className="shrink-0">{picker}</div>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className={className}>
      {picker}
      {error && <p role="alert" className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}

