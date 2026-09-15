ALTER TABLE subscriptions ALTER COLUMN status DROP NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN rc_app_user_id DROP NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN rc_environment DROP NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN rc_product_id DROP NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN rc_store DROP NOT NULL;
