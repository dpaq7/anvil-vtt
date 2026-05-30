export const ROOM_CODE_LENGTH = 10;

/** Normalize pasted room codes to the server-issued format. */
export function normalizeRoomCodeInput(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase().slice(0, ROOM_CODE_LENGTH);
}
