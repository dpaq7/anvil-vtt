-- Track the scene a live session should open on and resume to.
ALTER TABLE game_sessions ADD COLUMN active_scene_id TEXT;
