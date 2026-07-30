/**
 * One-way hashing for short-lived bearer tokens (currently WebSocket upgrade
 * tokens).
 *
 * The plaintext token is handed to the client once and never persisted; only
 * its SHA-256 digest is stored, so a database read cannot be replayed to open a
 * connection. Lookups hash the presented token and match on the digest.
 */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
