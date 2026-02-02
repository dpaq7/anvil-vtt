import { Container, Sprite, Texture } from 'pixi.js';

export class BackgroundLayer extends Container {
  private bg: Sprite | null = null;

  setImage(url: string | null, width: number, height: number): void {
    if (this.bg) {
      this.removeChild(this.bg);
      this.bg.destroy();
      this.bg = null;
    }

    if (!url) return;

    const texture = Texture.from(url);
    this.bg = new Sprite(texture);
    this.bg.width = width;
    this.bg.height = height;
    this.addChild(this.bg);
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
}
