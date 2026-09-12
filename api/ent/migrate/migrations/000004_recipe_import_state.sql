ALTER TABLE recipes ADD COLUMN import_status VARCHAR NOT NULL DEFAULT 'done';
ALTER TABLE recipes ADD COLUMN import_error VARCHAR;
ALTER TABLE recipes ADD COLUMN processing_at TIMESTAMPTZ;
ALTER TABLE recipes ADD COLUMN import_webhook JSONB;
ALTER TABLE recipes ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE recipes ADD CONSTRAINT recipes_import_status_check CHECK (import_status IN ('looking', 'making', 'done', 'failed'));
