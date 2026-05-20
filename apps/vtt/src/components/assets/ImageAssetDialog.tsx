import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Image as ImageIcon, ImagePlus, Trash2, Upload } from "lucide-react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@anvil/ui";
import { api } from "../../lib/api.js";
import { uploadFile } from "../../stores/assetsStore.js";

interface ImageAsset {
  id: string;
  name: string;
  type: string;
  content_type: string | null;
  uploaded_at?: string | null;
}

export interface ImageAssetDialogProps {
  title: string;
  currentImageUrl?: string | null;
  uploadDescription?: string;
  uploadType?: string;
  onSave: (assetId: string) => Promise<void>;
  onRemove?: () => Promise<void>;
  children: ReactNode;
}

function isUploadedImage(asset: ImageAsset): boolean {
  return (
    asset.uploaded_at != null &&
    (asset.content_type?.toLowerCase().startsWith("image/") ?? false)
  );
}

export function ImageAssetDialog({
  title,
  currentImageUrl,
  uploadDescription,
  uploadType = "other",
  onSave,
  onRemove,
  children,
}: ImageAssetDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageAssets, setImageAssets] = useState<ImageAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetDraft = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setSaving(false);
    setError(null);
  }, [previewUrl]);

  const handleOpenChange = (value: boolean) => {
    if (!value) resetDraft();
    setOpen(value);
  };

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoadingAssets(true);
    setError(null);
    api
      .get<{ assets: ImageAsset[] }>("/api/assets")
      .then(({ assets }) => {
        if (cancelled) return;
        setImageAssets(assets.filter(isUploadedImage));
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingAssets(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const assetId = await uploadFile(file, uploadType);
      await onSave(assetId);
      resetDraft();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
      setSaving(false);
    }
  };

  const handleSelectAsset = async (assetId: string) => {
    setSaving(true);
    setError(null);
    try {
      await onSave(assetId);
      resetDraft();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image update failed");
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    setSaving(true);
    setError(null);
    try {
      await onRemove();
      resetDraft();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image removal failed");
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogTitle className="text-sm">{title}</DialogTitle>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="grid gap-4">
          <div className="overflow-hidden rounded-md border border-zinc-800 bg-zinc-950/55">
            {previewUrl || currentImageUrl ? (
              <img
                src={previewUrl ?? currentImageUrl ?? undefined}
                alt=""
                className="aspect-[4/1.35] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/1.35] items-center justify-center text-zinc-500">
                <ImageIcon className="size-8" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
            >
              <ImagePlus className="size-4" />
              Choose Image
            </Button>
            {file && (
              <Button
                type="button"
                size="sm"
                onClick={handleUpload}
                disabled={saving}
              >
                <Upload className="size-4" />
                {saving ? "Saving..." : "Save Image"}
              </Button>
            )}
            <p className="text-xs text-zinc-500">
              {uploadDescription ??
                "Upload an image or choose one from assets."}
            </p>
          </div>

          {!previewUrl && (
            <div className="grid gap-2 border-t border-zinc-800 pt-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                <ImageIcon className="size-3.5" />
                Select from assets
              </div>
              {loadingAssets ? (
                <p className="rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-5 text-center text-xs text-zinc-500">
                  Loading image assets...
                </p>
              ) : error ? (
                <p className="rounded-md border border-red-900/60 bg-red-950/20 px-3 py-5 text-center text-xs text-red-300">
                  {error}
                </p>
              ) : imageAssets.length === 0 ? (
                <p className="rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-5 text-center text-xs text-zinc-500">
                  No image assets yet.
                </p>
              ) : (
                <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {imageAssets.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => handleSelectAsset(asset.id)}
                      disabled={saving}
                      className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-950/45 p-2 text-left transition hover:border-zinc-600 hover:bg-zinc-900 disabled:opacity-50"
                    >
                      <img
                        src={`/api/assets/${asset.id}/data`}
                        alt=""
                        className="h-14 w-24 shrink-0 rounded object-cover"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium text-zinc-200">
                          {asset.name}
                        </span>
                        <span className="mt-1 block text-[10px] uppercase tracking-wide text-zinc-500">
                          {asset.type}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {previewUrl && error && (
            <p className="rounded-md border border-red-900/60 bg-red-950/20 px-3 py-3 text-xs text-red-300">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            {currentImageUrl && onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-red-400 hover:text-red-300"
                onClick={handleRemove}
                disabled={saving}
              >
                <Trash2 className="mr-1 size-3" />
                Remove
              </Button>
            )}
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="sm" disabled={saving}>
              Cancel
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
