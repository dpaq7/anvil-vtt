-- Scope notes by director/player notebook for the same campaign user.

ALTER TABLE note_folders ADD COLUMN scope TEXT NOT NULL DEFAULT 'player';
ALTER TABLE notes ADD COLUMN scope TEXT NOT NULL DEFAULT 'player';

UPDATE note_folders
SET scope = 'director'
WHERE EXISTS (
  SELECT 1
  FROM campaigns c
  WHERE c.id = note_folders.campaign_id
    AND c.director_id = note_folders.user_id
);

UPDATE notes
SET scope = 'director'
WHERE EXISTS (
  SELECT 1
  FROM campaigns c
  WHERE c.id = notes.campaign_id
    AND c.director_id = notes.user_id
);

CREATE INDEX idx_note_folders_campaign_user_scope ON note_folders(campaign_id, user_id, scope);
CREATE INDEX idx_notes_campaign_user_scope ON notes(campaign_id, user_id, scope);
