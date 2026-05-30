-- Link uploaded portrait assets directly to heroes.
ALTER TABLE heroes ADD COLUMN portrait_asset_id TEXT REFERENCES assets(id) ON DELETE SET NULL;

CREATE INDEX idx_heroes_portrait_asset ON heroes(portrait_asset_id);
