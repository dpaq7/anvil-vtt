import { useState, useRef, useCallback, useEffect } from "react";
import { ImagePlus, Image as ImageIcon, Trash2, ZoomIn } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
  Button,
} from "@anvil/ui";
import { uploadFile } from "../../stores/assetsStore.js";
import { api } from "../../lib/api.js";

export interface MonsterPortraitDialogProps {
  monsterName: string;
  currentPortraitUrl?: string;
  onSave: (assetId: string) => Promise<void>;
  onRemove?: () => Promise<void>;
  title?: string;
  uploadDescription?: string;
  outputFileName?: string;
  children: React.ReactNode;
}

/** Crop output size in pixels. */
const OUTPUT_SIZE = 256;

interface PortraitAsset {
  id: string;
  name: string;
  type: string;
  content_type: string | null;
  uploaded_at?: string | null;
}

export function MonsterPortraitDialog({
  monsterName,
  currentPortraitUrl,
  onSave,
  onRemove,
  title,
  uploadDescription,
  outputFileName,
  children,
}: MonsterPortraitDialogProps) {
  const [open, setOpen] = useState(false);
  const [_file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1.2);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [portraitAssets, setPortraitAssets] = useState<PortraitAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const resetState = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setFile(null);
    setImageUrl(null);
    setScale(1.2);
    setOffset({ x: 0, y: 0 });
    setUploading(false);
  }, [imageUrl]);

  const handleOpenChange = (v: boolean) => {
    if (!v) resetState();
    setOpen(v);
  };

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoadingAssets(true);
    setAssetError(null);
    api
      .get<{ assets: PortraitAsset[] }>("/api/assets?type=portrait")
      .then(({ assets }) => {
        if (cancelled) return;
        setPortraitAssets(assets.filter((asset) => asset.uploaded_at != null));
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setAssetError(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingAssets(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setScale(1.2);
    setOffset({ x: 0, y: 0 });
  };

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  // Preload image element for canvas cropping
  useEffect(() => {
    if (!imageUrl) {
      imageRef.current = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // ── Drag handlers ──

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset({
      x: dragStart.current.offsetX + dx,
      y: dragStart.current.offsetY + dy,
    });
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  // ── Crop & upload ──

  const handleSave = async () => {
    if (!imageRef.current) return;
    setUploading(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d")!;

      // Circular clip
      ctx.beginPath();
      ctx.arc(
        OUTPUT_SIZE / 2,
        OUTPUT_SIZE / 2,
        OUTPUT_SIZE / 2,
        0,
        Math.PI * 2,
      );
      ctx.closePath();
      ctx.clip();

      // Map the preview area (200px CSS) to the output canvas (256px)
      const previewSize = 200;
      const ratio = OUTPUT_SIZE / previewSize;

      const img = imageRef.current;
      // Scale image to cover the preview circle
      const imgScale =
        Math.max(previewSize / img.width, previewSize / img.height) * scale;
      const drawW = img.width * imgScale * ratio;
      const drawH = img.height * imgScale * ratio;
      const drawX = (OUTPUT_SIZE - drawW) / 2 + offset.x * ratio;
      const drawY = (OUTPUT_SIZE - drawH) / 2 + offset.y * ratio;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))),
          "image/png",
        );
      });

      const portraitFile = new File(
        [blob],
        outputFileName ?? `${monsterName}-portrait.png`,
        { type: "image/png" },
      );
      const assetId = await uploadFile(portraitFile, "portrait");
      await onSave(assetId);

      resetState();
      setOpen(false);
    } catch {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    setUploading(true);
    try {
      await onRemove();
      resetState();
      setOpen(false);
    } catch {
      setUploading(false);
    }
  };

  const handleSelectAsset = async (assetId: string) => {
    setUploading(true);
    try {
      await onSave(assetId);
      resetState();
      setOpen(false);
    } catch {
      setUploading(false);
    }
  };

  // Preview size in CSS pixels
  const previewSize = 200;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogTitle className="text-sm">
          {title ?? `Portrait — ${monsterName}`}
        </DialogTitle>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Preview area */}
        {imageUrl ? (
          <div className="flex flex-col items-center gap-4">
            {/* Circular crop preview */}
            <div
              className="relative cursor-grab overflow-hidden rounded-full border-2 border-zinc-700 bg-zinc-900 active:cursor-grabbing"
              style={{ width: previewSize, height: previewSize }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <img
                src={imageUrl}
                alt=""
                draggable={false}
                className="pointer-events-none absolute select-none"
                style={{
                  width: `${Math.max(previewSize, previewSize) * scale}px`,
                  height: "auto",
                  left: `${(previewSize - Math.max(previewSize, previewSize) * scale) / 2 + offset.x}px`,
                  top: `${(previewSize - Math.max(previewSize, previewSize) * scale) / 2 + offset.y}px`,
                  minWidth: `${previewSize * scale}px`,
                  minHeight: `${previewSize * scale}px`,
                  objectFit: "cover",
                }}
              />
            </div>

            {/* Scale slider */}
            <div className="flex w-full items-center gap-2 px-4">
              <ZoomIn className="size-3.5 shrink-0 text-zinc-500" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-700 accent-zinc-400"
              />
              <span className="w-10 text-right text-[10px] text-zinc-500">
                {scale.toFixed(1)}x
              </span>
            </div>

            {/* Change image */}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-400"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose different image
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6">
            {currentPortraitUrl && (
              <div
                className="overflow-hidden rounded-full border-2 border-zinc-700"
                style={{ width: previewSize * 0.6, height: previewSize * 0.6 }}
              >
                <img
                  src={currentPortraitUrl}
                  alt=""
                  className="size-full object-cover"
                />
              </div>
            )}
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="mr-2 size-4" />
              Choose Image
            </Button>
            <p className="text-xs text-zinc-500">
              {uploadDescription ?? `Upload art for this monster's token`}
            </p>
          </div>
        )}

        {!imageUrl && (
          <div className="grid gap-2 border-t border-zinc-800 pt-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <ImageIcon className="size-3.5" />
              Select from assets
            </div>
            {loadingAssets ? (
              <p className="rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-4 text-center text-xs text-zinc-500">
                Loading portrait assets...
              </p>
            ) : assetError ? (
              <p className="rounded-md border border-red-900/60 bg-red-950/20 px-3 py-4 text-center text-xs text-red-300">
                {assetError}
              </p>
            ) : portraitAssets.length === 0 ? (
              <p className="rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-4 text-center text-xs text-zinc-500">
                No portrait assets yet.
              </p>
            ) : (
              <div className="grid max-h-52 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {portraitAssets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => handleSelectAsset(asset.id)}
                    disabled={uploading}
                    className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-950/45 p-2 text-left transition hover:border-zinc-600 hover:bg-zinc-900 disabled:opacity-50"
                  >
                    <img
                      src={`/api/assets/${asset.id}/data`}
                      alt=""
                      className="size-12 shrink-0 rounded object-cover"
                    />
                    <span className="min-w-0 truncate text-xs font-medium text-zinc-200">
                      {asset.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {currentPortraitUrl && onRemove && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-red-400 hover:text-red-300"
                onClick={handleRemove}
                disabled={uploading}
              >
                <Trash2 className="mr-1 size-3" />
                Remove
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="ghost" size="sm" disabled={uploading}>
                Cancel
              </Button>
            </DialogClose>
            {imageUrl && (
              <Button size="sm" onClick={handleSave} disabled={uploading}>
                {uploading ? "Saving…" : "Save Portrait"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
