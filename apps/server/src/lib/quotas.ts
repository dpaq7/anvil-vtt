import { USER_STORAGE_LIMITS } from '../policy/limits.js';

export const MAX_USER_STORAGE_BYTES = USER_STORAGE_LIMITS.maxBytes;
export const MAX_USER_ASSETS = USER_STORAGE_LIMITS.maxAssets;
export const PENDING_UPLOAD_TTL_HOURS = USER_STORAGE_LIMITS.pendingUploadTtlHours;
