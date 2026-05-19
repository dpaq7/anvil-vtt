export const USER_STORAGE_LIMITS = {
  maxBytes: 500 * 1024 * 1024,
  maxAssets: 1000,
  pendingUploadTtlHours: 24,
} as const;

export const ASSET_LIMITS = {
  maxFileBytes: 50 * 1024 * 1024,
  uploadRegisterPerHour: 60,
  uploadDataPerHour: 120,
} as const;

export const NOTE_LIMITS = {
  jsonBodyBytes: 256 * 1024,
  titleLength: 160,
  folderNameLength: 120,
  contentLength: 200 * 1024,
  reorderBatchItems: 500,
  searchLength: 120,
} as const;

export const SCENE_IMPORT_LIMITS = {
  jsonBodyBytes: 2 * 1024 * 1024,
  maxModules: 30,
  maxSessions: 150,
  maxScenes: 750,
  nameLength: 180,
  descriptionLength: 5_000,
  settingsBytes: 64 * 1024,
  sceneDataBytes: 256 * 1024,
} as const;

export const HERO_LIMITS = {
  jsonBodyBytes: 256 * 1024,
  nameLength: 160,
  portraitUrlLength: 2_048,
  inventoryBytes: 128 * 1024,
} as const;

export const WS_LIMITS = {
  messageBytes: 128 * 1024,
  entityJsonBytes: 24 * 1024,
  patchJsonBytes: 24 * 1024,
  sceneShapePoints: 2048,
  storyTextLength: 20_000,
  approachTextLength: 2_000,
  idLength: 220,
  inventoryItems: 160,
  inventoryTextLength: 2400,
} as const;

export const RATE_LIMIT_PROFILES = {
  authStart: { namespace: 'auth-start', limit: 30, windowSeconds: 10 * 60 },
  authCallback: { namespace: 'auth-callback', limit: 60, windowSeconds: 10 * 60 },
  devLogin: { namespace: 'dev-login', limit: 60, windowSeconds: 10 * 60 },
  assetUploadRegister: {
    namespace: 'asset-upload-register',
    limit: ASSET_LIMITS.uploadRegisterPerHour,
    windowSeconds: 60 * 60,
  },
  assetUploadData: {
    namespace: 'asset-upload-data',
    limit: ASSET_LIMITS.uploadDataPerHour,
    windowSeconds: 60 * 60,
  },
  roomCodeLookup: { namespace: 'room-code-lookup', limit: 30, windowSeconds: 10 * 60 },
  roomCodeJoin: { namespace: 'room-code-join', limit: 30, windowSeconds: 10 * 60 },
  noteWrite: { namespace: 'note-write', limit: 240, windowSeconds: 10 * 60 },
  sceneImport: { namespace: 'scene-import', limit: 20, windowSeconds: 60 * 60 },
} as const;
