CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name VARCHAR NOT NULL
);
CREATE INDEX IF NOT EXISTS folders_user_id_idx ON folders (user_id);

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders (id) ON DELETE SET NULL,
  name VARCHAR NOT NULL,
  servings INTEGER NOT NULL,
  process_minutes INTEGER NOT NULL,
  ingredients JSONB NOT NULL,
  instructions TEXT[] NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  rating DOUBLE PRECISION,
  notes VARCHAR,
  image_s3_key VARCHAR,
  url VARCHAR,
  source VARCHAR,
  webhook_id VARCHAR,
  raw_source_payload JSONB
);
CREATE INDEX IF NOT EXISTS recipes_user_id_idx ON recipes (user_id);
CREATE INDEX IF NOT EXISTS recipes_folder_id_idx ON recipes (folder_id);
CREATE INDEX IF NOT EXISTS recipes_webhook_id_idx ON recipes (webhook_id);

CREATE TABLE IF NOT EXISTS groceries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  unit VARCHAR NOT NULL,
  tag VARCHAR
);
CREATE INDEX IF NOT EXISTS groceries_user_id_idx ON groceries (user_id);
