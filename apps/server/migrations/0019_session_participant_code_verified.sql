-- Track whether a participant has passed the session's room code.
-- The room code is validated once at POST /sessions/:id/join (sets this to 1);
-- ws-token issuance then requires it, so reconnects/direct-nav can't bypass the
-- code. Existing rows are grandfathered as verified so currently-live sessions
-- aren't disrupted by this migration; only new joins must present the code.
ALTER TABLE session_participants ADD COLUMN code_verified INTEGER NOT NULL DEFAULT 0;
UPDATE session_participants SET code_verified = 1;
