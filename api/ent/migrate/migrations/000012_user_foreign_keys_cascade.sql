ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_user_accounts_fkey;
ALTER TABLE accounts ADD CONSTRAINT accounts_user_accounts_fkey FOREIGN KEY (user_accounts) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_user_refresh_tokens_fkey;
ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_user_refresh_tokens_fkey FOREIGN KEY (user_refresh_tokens) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_sessions_fkey;
ALTER TABLE sessions ADD CONSTRAINT sessions_user_sessions_fkey FOREIGN KEY (user_sessions) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE folders DROP CONSTRAINT IF EXISTS folders_user_id_fkey;
ALTER TABLE folders ADD CONSTRAINT folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_user_id_fkey;
ALTER TABLE recipes ADD CONSTRAINT recipes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE groceries DROP CONSTRAINT IF EXISTS groceries_user_id_fkey;
ALTER TABLE groceries ADD CONSTRAINT groceries_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE meal_calendar_entries DROP CONSTRAINT IF EXISTS meal_calendar_entries_user_id_fkey;
ALTER TABLE meal_calendar_entries ADD CONSTRAINT meal_calendar_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE revenue_cat_identities DROP CONSTRAINT IF EXISTS revenue_cat_identities_user_id_fkey;
ALTER TABLE revenue_cat_identities ADD CONSTRAINT revenue_cat_identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
