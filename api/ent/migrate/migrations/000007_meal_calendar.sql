ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR NOT NULL DEFAULT 'UTC';

CREATE TABLE IF NOT EXISTS meal_calendar_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  planned_date DATE NOT NULL,
  meal_slot VARCHAR NOT NULL,
  scheduled_time TIME,
  recipe_id UUID REFERENCES recipes (id) ON DELETE SET NULL,
  timezone VARCHAR NOT NULL,
  notes VARCHAR
);
CREATE INDEX IF NOT EXISTS meal_calendar_entries_user_date_idx ON meal_calendar_entries (user_id, planned_date);
