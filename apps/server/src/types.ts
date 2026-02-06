export interface Env {
  DB: D1Database;
  ASSETS: R2Bucket;
  SESSION_ROOM: DurableObjectNamespace;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  DISCORD_REDIRECT_URI: string;
  SESSION_SECRET: string;
  FRONTEND_URL: string;
  ENVIRONMENT: string;
}

export type UserRole = 'director' | 'player';

export interface AuthUser {
  id: string;
  discordId: string;
  username: string;
  avatarUrl: string | null;
  role: UserRole;
}

export interface AppVariables {
  user: AuthUser;
}

export type AppEnv = { Bindings: Env; Variables: AppVariables };
