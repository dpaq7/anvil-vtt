# Security Controls

This document maps common attack classes to the central code paths that enforce Anvil's security policy.

## Global Request Policy

- Response security headers and CSRF are applied in `apps/server/src/security/index.ts`.
- Cookie/session and CSRF primitives live in `apps/server/src/middleware/auth.ts`.
- Shared request-size parsing lives in `apps/server/src/security/request.ts`.
- Shared limits live in `apps/server/src/policy/limits.ts`.

## Access Control

- Campaign, session, and scene authorization helpers are exported through `apps/server/src/security/authorization.ts`.
- Low-level SQL ownership checks live in `apps/server/src/lib/access.ts`.
- Routes should call `requireCampaignMember`, `requireCampaignDirector`, `requireSessionMember`, `requireSessionDirector`, `requireSceneMember`, or `requireSceneDirector` rather than inline membership SQL.

## Rate Limits And Abuse Controls

- The D1-backed limiter lives in `apps/server/src/lib/rate-limit.ts`.
- Named profiles live in `apps/server/src/security/rate-limits.ts`.
- Current named profiles cover OAuth entry/callbacks, dev login, asset uploads, room-code lookup/join, note writes, and scene imports.

## Uploads And Asset Serving

- MIME allowlists, active-content blocking, and attachment policy live in `apps/server/src/lib/assets.ts`.
- Route-facing asset ownership validators live in `apps/server/src/security/assets.ts`.
- Storage quotas live in `apps/server/src/policy/limits.ts` and are re-exported by `apps/server/src/lib/quotas.ts`.

## Rich Content

- Markdown rendering goes through `apps/vtt/src/lib/markdown.ts`.
- HTML output is sanitized in `apps/vtt/src/lib/html-sanitizer.ts` before TipTap receives it.
- Note request shapes and size limits are normalized in `apps/server/src/contracts/notes.ts`.

## Imports

- Scene import request validation and count/data-size caps live in `apps/server/src/contracts/scene-import.ts`.
- Scene import persistence lives in `apps/server/src/lib/scene-import.ts`.

## Hero Rules

- Server-side hero rule calculations are centralized in `apps/server/src/services/hero-rules.ts`.
- Hero routes should use this service for creation validation, derived stamina/recovery values, and portrait URL policy.

## WebSocket Protocol

- Shared client/server protocol types live in `packages/types/src/protocol.ts`.
- Server and VTT local protocol modules re-export that shared source.
- Durable Object runtime message limits are sourced from `apps/server/src/policy/limits.ts`.

## Audit Events

- Structured security audit logging lives in `apps/server/src/security/audit.ts`.
- Current hooks log auth failures, CSRF failures, authorization denials, and rate-limit rejections.
