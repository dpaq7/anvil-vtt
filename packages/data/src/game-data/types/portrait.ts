// Portrait settings for character inventory display

export type PortraitSource = 'upload' | 'url' | 'default';
export type PortraitPosition = 'top' | 'center' | 'bottom';
export type PortraitBorder = 'none' | 'frame' | 'vignette';

export interface PortraitSettings {
  source: PortraitSource;
  imageData: string | null; // Base64 for uploads, URL for external
  opacity: number; // 0.05 - 0.5, default 0.15
  position: PortraitPosition; // Vertical alignment
  scale: number; // 0.5 - 2.0, default 1.0
  grayscale: boolean; // Apply grayscale filter
  border: PortraitBorder; // Optional styling
}

export const DEFAULT_PORTRAIT_SETTINGS: PortraitSettings = {
  source: 'default',
  imageData: null,
  opacity: 0.15,
  position: 'center',
  scale: 1.0,
  grayscale: true,
  border: 'vignette',
};
