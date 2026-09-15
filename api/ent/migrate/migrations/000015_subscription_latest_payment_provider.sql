ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS latest_payment_provider VARCHAR;
