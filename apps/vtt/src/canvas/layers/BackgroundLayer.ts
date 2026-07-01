import { Container, Sprite, Texture } from 'pixi.js';
import {
  mediaElementCrossOrigin,
  resolveApiBackedMediaUrl,
} from '../../lib/api-url.js';

export interface ImageLoadedInfo {
  naturalWidth: number;
  naturalHeight: number;
}

export class BackgroundLayer extends Container {
  private bg: Sprite | null = null;
  private loadingUrl: string | null = null;

  setImage(
    url: string | null,
    onLoaded?: (info: ImageLoadedInfo) => void,
  ): void {
    if (this.bg) {
      this.removeChild(this.bg);
      this.bg.destroy();
      this.bg = null;
    }

    if (!url) {
      this.loadingUrl = null;
      return;
    }

    const resolvedUrl = resolveApiBackedMediaUrl(url);
    this.loadingUrl = resolvedUrl;

    // Use a plain HTMLImageElement to load the URL. This avoids PixiJS's
    // Assets.load() resolver which requires a file extension to pick the
    // correct parser. Our asset URLs (/api/assets/{id}/data) have no
    // extension, so we load the image directly and build a Texture from it.
    const img = new Image();
    const crossOrigin = mediaElementCrossOrigin(resolvedUrl);
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => {
      // Guard against stale loads (URL changed while loading) or destroyed layer
      if (this.loadingUrl !== resolvedUrl || this.destroyed) return;

      const texture = Texture.from(img);

      if (this.bg) {
        this.removeChild(this.bg);
        this.bg.destroy();
        this.bg = null;
      }

      // Render at the image's native pixel dimensions — no stretching
      this.bg = new Sprite(texture);
      this.bg.width = img.naturalWidth;
      this.bg.height = img.naturalHeight;
      this.addChild(this.bg);

      // Notify caller of natural dimensions after sprite is created
      onLoaded?.({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
    };
    img.onerror = () => {
      // Image failed to load (404, network error, etc.) — silently ignore
    };
    img.src = resolvedUrl;
  }

  setColor(color: number, width: number, height: number): void {
    if (this.bg) {
      this.removeChild(this.bg);
      this.bg.destroy();
      this.bg = null;
    }

    const texture = Texture.WHITE;
    this.bg = new Sprite(texture);
    this.bg.tint = color;
    this.bg.width = width;
    this.bg.height = height;
    this.addChild(this.bg);
  }

  /** Get the native dimensions of the current background sprite. */
  getNaturalSize(): { width: number; height: number } | null {
    if (!this.bg) return null;
    return { width: this.bg.texture.width, height: this.bg.texture.height };
  }
}
