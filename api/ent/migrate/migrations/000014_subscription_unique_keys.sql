CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_key
  ON subscriptions (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_rc_app_user_id_key
  ON subscriptions (rc_app_user_id)
  WHERE rc_app_user_id IS NOT NULL;
