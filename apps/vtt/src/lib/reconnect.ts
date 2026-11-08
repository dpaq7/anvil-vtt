/**
 * How long a dropped table keeps retrying before the shell says "Can't reach the table"
 * (DESIGN.md section 9, Gate 4). A tunable guess: change it here and nowhere else.
 */
export const RECONNECT_GIVE_UP_MS = 30_000;

/** The same limit in whole seconds, for copy ("Anvil tried for 30 seconds"). */
export const RECONNECT_GIVE_UP_SECONDS = Math.round(RECONNECT_GIVE_UP_MS / 1000);

/** One try during a drop may hang this long before it is dropped and tried again. */
export const RECONNECT_ATTEMPT_TIMEOUT_MS = 10_000;

/** The server's answers that say this link will not open: nothing to retry. */
export const isBadSessionLink = (status: number | null) =>
  status === 400 || status === 403 || status === 404;

/** The login has expired: the way on is to sign in, not to retry. */
export const isSignedOut = (status: number | null) => status === 401;
