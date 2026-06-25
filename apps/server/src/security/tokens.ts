/**
 * One-way hashing for short-lived bearer tokens (e.g. WebSocket upgrade tokens).
 *
 * Tokens are returned to the client in plaintext but stored only as their
 * SHA-256 hash, so a database read cannot be replayed to open a connection.
 * Lookups hash the presented token and compare against the stored digest.
 */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
