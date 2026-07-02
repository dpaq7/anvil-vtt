import type { Context } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import {
  isAllowedAssetContentType,
  normalizeContentType,
  type AssetType,
} from '../lib/assets.js';

interface AssetPolicyRow {
  type: string;
  content_type: string | null;
}

type ContentFamily = 'image' | 'audio' | 'allowed';

interface OwnedAssetPolicy {
  assetTypes?: readonly AssetType[];
  contentFamily?: ContentFamily;
  label: string;
  allowNull?: boolean;
}

export function assetDataUrl(assetId: string): string {
  return `/api/assets/${assetId}/data`;
}

function contentFamilyAllowed(asset: AssetPolicyRow, family: ContentFamily): boolean {
  const contentType = normalizeContentType(asset.content_type);
  if (!contentType) return true;
  if (!isAllowedAssetContentType(asset.type, contentType)) return false;
  if (family === 'image') return contentType.startsWith('image/');
  if (family === 'audio') return contentType.startsWith('audio/');
  return true;
}

export async function validateOwnedAsset(
  c: Context<AppEnv>,
  assetId: string | null | undefined,
  user: AuthUser,
  policy: OwnedAssetPolicy,
): Promise<Response | null> {
  if (!assetId) return policy.allowNull ?? true ? null : c.json({ error: `${policy.label} is required` }, 400);

  const asset = await c.env.DB.prepare('SELECT type, content_type FROM assets WHERE id = ? AND user_id = ?')
    .bind(assetId, user.id)
    .first<AssetPolicyRow>();
  if (!asset) return c.json({ error: 'Asset not found' }, 404);
  if (policy.assetTypes && !policy.assetTypes.includes(asset.type as AssetType)) {
    return c.json({ error: `Asset must be ${policy.label}` }, 400);
  }
  if (policy.contentFamily && !contentFamilyAllowed(asset, policy.contentFamily)) {
    return c.json({ error: `Asset must be ${policy.contentFamily}` }, 400);
  }
  return null;
}

export function validateOwnedMapAsset(c: Context<AppEnv>, assetId: string | null | undefined, user: AuthUser): Promise<Response | null> {
  return validateOwnedAsset(c, assetId, user, { assetTypes: ['map'], contentFamily: 'image', label: 'a map' });
}

export function validateOwnedPortraitAsset(c: Context<AppEnv>, assetId: string | null | undefined, user: AuthUser): Promise<Response | null> {
  return validateOwnedAsset(c, assetId, user, { assetTypes: ['portrait'], contentFamily: 'image', label: 'a portrait' });
}

export function validateOwnedImageAsset(c: Context<AppEnv>, assetId: string | null | undefined, user: AuthUser): Promise<Response | null> {
  return validateOwnedAsset(c, assetId, user, { contentFamily: 'image', label: 'an image' });
}

export function validateOwnedAudioAsset(c: Context<AppEnv>, assetId: string | null | undefined, user: AuthUser): Promise<Response | null> {
  return validateOwnedAsset(c, assetId, user, { assetTypes: ['audio', 'other'], contentFamily: 'audio', label: 'audio', allowNull: false });
}
