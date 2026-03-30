ALTER TABLE characters ADD COLUMN builder_data jsonb DEFAULT '{}';
ALTER TABLE characters ADD COLUMN level_choices jsonb DEFAULT '[]';