ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_users_accounts;
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_user_accounts_fkey;
ALTER TABLE accounts ADD CONSTRAINT accounts_users_accounts FOREIGN KEY (user_accounts) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_users_refresh_tokens;
ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_user_refresh_tokens_fkey;
ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_users_refresh_tokens FOREIGN KEY (user_refresh_tokens) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_users_sessions;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_sessions_fkey;
ALTER TABLE sessions ADD CONSTRAINT sessions_users_sessions FOREIGN KEY (user_sessions) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE folders DROP CONSTRAINT IF EXISTS folders_users_folders;
ALTER TABLE folders DROP CONSTRAINT IF EXISTS folders_user_id_fkey;
ALTER TABLE folders ADD CONSTRAINT folders_users_folders FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_users_recipes;
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_user_id_fkey;
ALTER TABLE recipes ADD CONSTRAINT recipes_users_recipes FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE groceries DROP CONSTRAINT IF EXISTS groceries_users_groceries;
ALTER TABLE groceries DROP CONSTRAINT IF EXISTS groceries_user_id_fkey;
ALTER TABLE groceries ADD CONSTRAINT groceries_users_groceries FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE meal_calendar_entries DROP CONSTRAINT IF EXISTS meal_calendar_entries_users_meal_calendar_entries;
ALTER TABLE meal_calendar_entries DROP CONSTRAINT IF EXISTS meal_calendar_entries_user_id_fkey;
ALTER TABLE meal_calendar_entries ADD CONSTRAINT meal_calendar_entries_users_meal_calendar_entries FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_users_subscriptions;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_users_subscriptions FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE revenue_cat_identities DROP CONSTRAINT IF EXISTS revenue_cat_identities_users_revenue_cat_identities;
ALTER TABLE revenue_cat_identities DROP CONSTRAINT IF EXISTS revenue_cat_identities_user_id_fkey;
ALTER TABLE revenue_cat_identities ADD CONSTRAINT revenue_cat_identities_users_revenue_cat_identities FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
