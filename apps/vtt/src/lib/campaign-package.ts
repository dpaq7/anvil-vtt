import type {
  CampaignPackageAsset,
  CampaignPackageImportResult,
  CampaignPackageManifest,
} from '@anvil/types';
import { CAMPAIGN_PACKAGE_FORMAT } from '@anvil/types';
import { api } from './api.js';

const MAX_ARCHIVE_BYTES = 550 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 500 * 1024 * 1024;
const MAX_FILES = 1001;
const MANIFEST_PATH = 'manifest.json';

interface ZipEntry {
  path: string;
  method: number;
  flags: number;
  compressedSize: number;
  uncompressedSize: number;
  localOffset: number;
}

function u16(view: DataView, offset: number): number { return view.getUint16(offset, true); }
function u32(view: DataView, offset: number): number { return view.getUint32(offset, true); }

function safePath(path: string): boolean {
  return !path.startsWith('/') && !path.includes('\\')
    && path.split('/').every((part) => part.length > 0 && part !== '.' && part !== '..');
}

function readZipEntries(bytes: Uint8Array): Map<string, ZipEntry> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  const minimum = Math.max(0, bytes.length - 65_557);
  for (let offset = bytes.length - 22; offset >= minimum; offset -= 1) {
    if (u32(view, offset) === 0x06054b50) { eocd = offset; break; }
  }
  if (eocd < 0) throw new Error('This is not a valid .cam ZIP archive.');
  const entryCount = u16(view, eocd + 10);
  const centralSize = u32(view, eocd + 12);
  const centralOffset = u32(view, eocd + 16);
  if (entryCount > MAX_FILES) throw new Error(`Campaign packages may contain at most ${MAX_FILES - 1} assets.`);
  if (centralOffset + centralSize > eocd) throw new Error('The .cam central directory is invalid.');

  const decoder = new TextDecoder('utf-8', { fatal: true });
  const entries = new Map<string, ZipEntry>();
  let offset = centralOffset;
  let expanded = 0;
  for (let index = 0; index < entryCount; index += 1) {
    if (u32(view, offset) !== 0x02014b50) throw new Error('The .cam central directory is damaged.');
    const flags = u16(view, offset + 8);
    const method = u16(view, offset + 10);
    const compressedSize = u32(view, offset + 20);
    const uncompressedSize = u32(view, offset + 24);
    const nameLength = u16(view, offset + 28);
    const extraLength = u16(view, offset + 30);
    const commentLength = u16(view, offset + 32);
    const localOffset = u32(view, offset + 42);
    const path = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    if ((flags & 1) !== 0) throw new Error('Encrypted .cam archives are not supported.');
    if (method !== 0 && method !== 8) throw new Error(`Unsupported ZIP compression method for ${path}.`);
    if (!safePath(path)) throw new Error(`Unsafe path in .cam archive: ${path}`);
    if (entries.has(path)) throw new Error(`Duplicate path in .cam archive: ${path}`);
    expanded += uncompressedSize;
    if (expanded > MAX_EXPANDED_BYTES) throw new Error('The expanded campaign package exceeds 500 MB.');
    entries.set(path, { path, method, flags, compressedSize, uncompressedSize, localOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const source = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  const stream = new Blob([source]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function extractEntry(archive: Uint8Array, entry: ZipEntry): Promise<Uint8Array> {
  const view = new DataView(archive.buffer, archive.byteOffset, archive.byteLength);
  if (u32(view, entry.localOffset) !== 0x04034b50) throw new Error(`Invalid local ZIP entry: ${entry.path}`);
  const nameLength = u16(view, entry.localOffset + 26);
  const extraLength = u16(view, entry.localOffset + 28);
  const start = entry.localOffset + 30 + nameLength + extraLength;
  const end = start + entry.compressedSize;
  if (end > archive.length) throw new Error(`Truncated ZIP entry: ${entry.path}`);
  const compressed = archive.subarray(start, end);
  const result = entry.method === 0 ? compressed.slice() : await inflateRaw(compressed);
  if (result.byteLength !== entry.uncompressedSize) throw new Error(`Expanded size mismatch: ${entry.path}`);
  return result;
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  const source = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', source));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function assertManifest(value: unknown): asserts value is CampaignPackageManifest {
  if (!value || typeof value !== 'object') throw new Error('manifest.json must contain an object.');
  const manifest = value as Partial<CampaignPackageManifest>;
  if (manifest.format !== CAMPAIGN_PACKAGE_FORMAT || manifest.version !== 1 || !Array.isArray(manifest.assets)) {
    throw new Error('Unsupported campaign package manifest.');
  }
}

export interface ParsedCampaignPackage {
  manifest: CampaignPackageManifest;
  files: Map<string, Uint8Array>;
}

export async function parseCampaignPackage(file: File): Promise<ParsedCampaignPackage> {
  if (file.size <= 0 || file.size > MAX_ARCHIVE_BYTES) throw new Error('The .cam file must be between 1 byte and 550 MB.');
  const archive = new Uint8Array(await file.arrayBuffer());
  const entries = readZipEntries(archive);
  const manifestEntry = entries.get(MANIFEST_PATH);
  if (!manifestEntry || manifestEntry.uncompressedSize > 2 * 1024 * 1024) {
    throw new Error('A .cam package needs a root manifest.json smaller than 2 MB.');
  }
  const manifestBytes = await extractEntry(archive, manifestEntry);
  let raw: unknown;
  try { raw = JSON.parse(new TextDecoder().decode(manifestBytes)); }
  catch { throw new Error('manifest.json is not valid JSON.'); }
  assertManifest(raw);

  const files = new Map<string, Uint8Array>();
  const refs = new Set<string>();
  for (const asset of raw.assets) {
    if (!asset.ref || refs.has(asset.ref)) throw new Error(`Duplicate or missing asset ref: ${asset.ref || '(empty)'}`);
    refs.add(asset.ref);
    const entry = entries.get(asset.path);
    if (!entry) throw new Error(`Missing packaged asset: ${asset.path}`);
    if (entry.uncompressedSize !== asset.size) throw new Error(`Size mismatch for ${asset.path}`);
    const bytes = await extractEntry(archive, entry);
    if (await sha256Hex(bytes) !== asset.sha256.toLowerCase()) throw new Error(`SHA-256 mismatch for ${asset.path}`);
    files.set(asset.ref, bytes);
  }
  return { manifest: raw, files };
}

async function uploadAsset(asset: CampaignPackageAsset, bytes: Uint8Array): Promise<string> {
  const created = await api.post<{ id: string }>('/api/assets/upload', {
    name: asset.name,
    type: asset.type,
    contentType: asset.contentType,
    size: asset.size,
  });
  const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  await api.putRaw(`/api/assets/${created.id}/data`, data, asset.contentType);
  return created.id;
}

export async function importCampaignPackage(
  parsed: ParsedCampaignPackage,
  onProgress?: (complete: number, total: number, name: string) => void,
): Promise<CampaignPackageImportResult> {
  const uploadedAssets: Record<string, string> = {};
  try {
    for (const [index, asset] of parsed.manifest.assets.entries()) {
      onProgress?.(index, parsed.manifest.assets.length, asset.name);
      const bytes = parsed.files.get(asset.ref);
      if (!bytes) throw new Error(`Missing verified bytes for ${asset.ref}`);
      uploadedAssets[asset.ref] = await uploadAsset(asset, bytes);
    }
    onProgress?.(parsed.manifest.assets.length, parsed.manifest.assets.length, 'Creating campaign');
    return await api.post<CampaignPackageImportResult>('/api/campaigns/import-package', {
      manifest: parsed.manifest,
      uploadedAssets,
    });
  } catch (error) {
    await Promise.allSettled(Object.values(uploadedAssets).map((id) => api.delete(`/api/assets/${id}`)));
    throw error;
  }
}
