/**
 * How long a dropped table keeps retrying before the shell says "Can't reach the table"
 * (DESIGN.md section 9, Gate 4). A tunable guess: change it here and nowhere else.
 */
export const RECONNECT_GIVE_UP_MS = 30_000;

/** The same limit in whole seconds, for copy ("Anvil tried for 30 seconds"). */
export const RECONNECT_GIVE_UP_SECONDS = Math.round(RECONNECT_GIVE_UP_MS / 1000);
