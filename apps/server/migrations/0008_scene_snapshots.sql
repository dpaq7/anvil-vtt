-- Add snapshot column to scenes for storing end-of-session state
ALTER TABLE scenes ADD COLUMN snapshot TEXT;
