import type { ForgeSteelHeroFile, ForgeSteelHeroImportResult } from '@anvil/types';
import { api } from './api.js';

const MAX_HERO_FILE_BYTES = 2 * 1024 * 1024;

function embeddedPortrait(hero: ForgeSteelHeroFile): { bytes: ArrayBuffer; contentType: string } | null {
  if (typeof hero.picture !== 'string') return null;
  const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([a-zA-Z0-9+/=\s]+)$/.exec(hero.picture);
  if (!match) return null;
  const decoded = atob(match[2]!.replace(/\s/g, ''));
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) bytes[index] = decoded.charCodeAt(index);
  return { bytes: bytes.buffer, contentType: match[1]! };
}

export async function importForgeSteelHero(file: File): Promise<ForgeSteelHeroImportResult> {
  if (file.size <= 0 || file.size > MAX_HERO_FILE_BYTES) {
    throw new Error('Forge Steel hero files must be smaller than 2 MB.');
  }

  let raw: unknown;
  try {
    raw = JSON.parse(await file.text()) as unknown;
  } catch {
    throw new Error('The selected file is not valid Forge Steel hero JSON.');
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('The selected file is not a Forge Steel hero export.');
  }

  const hero = raw as ForgeSteelHeroFile;
  let portraitAssetId: string | null = null;
  try {
    const portrait = embeddedPortrait(hero);
    if (portrait) {
      const registered = await api.post<{ id: string }>('/api/assets/upload', {
        name: `${typeof hero.name === 'string' ? hero.name : 'Forge Steel Hero'} portrait`,
        type: 'portrait',
        contentType: portrait.contentType,
        size: portrait.bytes.byteLength,
      });
      portraitAssetId = registered.id;
      await api.putRaw(`/api/assets/${registered.id}/data`, portrait.bytes, portrait.contentType);
    }

    return await api.post<ForgeSteelHeroImportResult>('/api/heroes/import/forge-steel', {
      hero,
      portraitAssetId,
    });
  } catch (error) {
    if (portraitAssetId) await api.delete(`/api/assets/${portraitAssetId}`).catch(() => undefined);
    throw error;
  }
}

