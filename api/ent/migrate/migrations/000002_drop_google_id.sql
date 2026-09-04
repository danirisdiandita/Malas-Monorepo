DROP INDEX IF EXISTS users_google_id_key;
ALTER TABLE users DROP COLUMN IF EXISTS google_id;
