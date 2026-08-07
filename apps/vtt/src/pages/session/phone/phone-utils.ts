import type { EntityData } from "../../../types/protocol.js";

export function num(
  entity: EntityData | null | undefined,
  key: string,
  fallback = 0,
) {
  const value = entity?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function str(
  entity: EntityData | null | undefined,
  key: string,
  fallback = "",
) {
  const value = entity?.[key];
  return typeof value === "string" ? value : fallback;
}
