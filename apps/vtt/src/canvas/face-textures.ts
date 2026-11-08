import { ImageSource, Texture } from 'pixi.js';

/** Textures for drawn art (faces, map icons). Cached for the page; they are small and few. */
const loaded = new Map<string, Texture>();
const pending = new Map<string, Promise<Texture>>();

export function artTexture(url: string, onReady: (texture: Texture) => void): void {
  const hit = loaded.get(url);
  if (hit) {
    onReady(hit);
    return;
  }
  let load = pending.get(url);
  if (!load) {
    load = new Promise<Texture>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const texture = new Texture({
          source: new ImageSource({ resource: img, autoGenerateMipmaps: true, scaleMode: 'linear' }),
        });
        loaded.set(url, texture);
        pending.delete(url);
        resolve(texture);
      };
      img.onerror = () => reject(new Error('Could not draw map art'));
      img.src = url;
    });
    pending.set(url, load);
  }
  void load.then(onReady).catch(() => {
    /* The token keeps its frame; nothing else depends on the art. */
  });
}
