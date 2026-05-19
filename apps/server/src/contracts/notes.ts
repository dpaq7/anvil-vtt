import type {
  CreateNoteFolderInput,
  CreateNoteInput,
  ReorderNotesInput,
  UpdateNoteFolderInput,
  UpdateNoteInput,
} from '@anvil/types';
import { NOTE_LIMITS } from '../policy/limits.js';
import {
  boundedInteger,
  isRecord,
  trimString,
  type ValidationResult,
} from '../security/validation.js';

const MAX_ID_LENGTH = 220;
const MAX_SORT_ORDER = 1_000_000;

function idString(value: unknown): string | null {
  return trimString(value, MAX_ID_LENGTH);
}

function contentString(value: unknown): ValidationResult<string> {
  if (value === undefined || value === null) return { ok: true, value: '' };
  if (typeof value !== 'string') return { ok: false, error: 'Content must be text' };
  if (value.length > NOTE_LIMITS.contentLength) return { ok: false, error: 'Content is too large', status: 413 };
  return { ok: true, value };
}

export function normalizeNoteSearchQuery(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, NOTE_LIMITS.searchLength) : null;
}

export function parseCreateNoteFolderInput(raw: unknown): ValidationResult<CreateNoteFolderInput> {
  if (!isRecord(raw)) return { ok: false, error: 'Folder must be an object' };
  const name = trimString(raw['name'], NOTE_LIMITS.folderNameLength);
  if (!name) return { ok: false, error: 'Name is required' };
  const parentFolderId = raw['parentFolderId'] === undefined || raw['parentFolderId'] === null
    ? undefined
    : idString(raw['parentFolderId']);
  if (raw['parentFolderId'] !== undefined && raw['parentFolderId'] !== null && !parentFolderId) {
    return { ok: false, error: 'Invalid parent folder' };
  }
  return { ok: true, value: { name, ...(parentFolderId ? { parentFolderId } : {}) } };
}

export function parseUpdateNoteFolderInput(raw: unknown): ValidationResult<UpdateNoteFolderInput> {
  if (!isRecord(raw)) return { ok: false, error: 'Folder update must be an object' };
  const value: UpdateNoteFolderInput = {};

  if (raw['name'] !== undefined) {
    const name = trimString(raw['name'], NOTE_LIMITS.folderNameLength);
    if (!name) return { ok: false, error: 'Name is required' };
    value.name = name;
  }
  if (raw['parentFolderId'] !== undefined) {
    if (raw['parentFolderId'] === null) {
      value.parentFolderId = null;
    } else {
      const parentFolderId = idString(raw['parentFolderId']);
      if (!parentFolderId) return { ok: false, error: 'Invalid parent folder' };
      value.parentFolderId = parentFolderId;
    }
  }
  if (raw['sortOrder'] !== undefined) {
    const sortOrder = boundedInteger(raw['sortOrder'], 0, MAX_SORT_ORDER);
    if (sortOrder === null) return { ok: false, error: 'Invalid sort order' };
    value.sortOrder = sortOrder;
  }

  return { ok: true, value };
}

export function parseCreateNoteInput(raw: unknown): ValidationResult<CreateNoteInput> {
  if (!isRecord(raw)) return { ok: false, error: 'Note must be an object' };
  const title = trimString(raw['title'], NOTE_LIMITS.titleLength);
  if (!title) return { ok: false, error: 'Title is required' };
  const folderId = idString(raw['folderId']);
  if (!folderId) return { ok: false, error: 'Folder is required' };
  const content = contentString(raw['content']);
  if (!content.ok) return content;
  return { ok: true, value: { title, folderId, content: content.value } };
}

export function parseUpdateNoteInput(raw: unknown): ValidationResult<UpdateNoteInput> {
  if (!isRecord(raw)) return { ok: false, error: 'Note update must be an object' };
  const value: UpdateNoteInput = {};

  if (raw['title'] !== undefined) {
    const title = trimString(raw['title'], NOTE_LIMITS.titleLength);
    if (!title) return { ok: false, error: 'Title is required' };
    value.title = title;
  }
  if (raw['content'] !== undefined) {
    const content = contentString(raw['content']);
    if (!content.ok) return content;
    value.content = content.value;
  }
  if (raw['folderId'] !== undefined) {
    const folderId = idString(raw['folderId']);
    if (!folderId) return { ok: false, error: 'Invalid folder' };
    value.folderId = folderId;
  }
  if (raw['sortOrder'] !== undefined) {
    const sortOrder = boundedInteger(raw['sortOrder'], 0, MAX_SORT_ORDER);
    if (sortOrder === null) return { ok: false, error: 'Invalid sort order' };
    value.sortOrder = sortOrder;
  }

  return { ok: true, value };
}

export function parseReorderNotesInput(raw: unknown): ValidationResult<ReorderNotesInput> {
  if (!isRecord(raw) || !Array.isArray(raw['items'])) return { ok: false, error: 'No items to reorder' };
  if (raw['items'].length === 0) return { ok: false, error: 'No items to reorder' };
  if (raw['items'].length > NOTE_LIMITS.reorderBatchItems) {
    return { ok: false, error: 'Too many reorder items', status: 413 };
  }

  const items: ReorderNotesInput['items'] = [];
  for (const item of raw['items']) {
    if (!isRecord(item)) return { ok: false, error: 'Invalid reorder item' };
    const id = idString(item['id']);
    const sortOrder = boundedInteger(item['sortOrder'], 0, MAX_SORT_ORDER);
    if (!id || sortOrder === null) return { ok: false, error: 'Invalid reorder item' };

    const next: ReorderNotesInput['items'][number] = { id, sortOrder };
    if (item['folderId'] !== undefined) {
      const folderId = idString(item['folderId']);
      if (!folderId) return { ok: false, error: 'Invalid folder' };
      next.folderId = folderId;
    }
    if (item['parentFolderId'] !== undefined) {
      if (item['parentFolderId'] === null) {
        next.parentFolderId = null;
      } else {
        const parentFolderId = idString(item['parentFolderId']);
        if (!parentFolderId) return { ok: false, error: 'Invalid parent folder' };
        next.parentFolderId = parentFolderId;
      }
    }
    items.push(next);
  }

  return { ok: true, value: { items } };
}
