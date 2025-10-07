-- Add pending_plan and pending_billing_interval columns to track scheduled downgrades
ALTER TABLE user_subscriptions
ADD COLUMN pending_plan subscription_plan,
ADD COLUMN pending_billing_interval billing_interval;

COMMENT ON COLUMN user_subscriptions.pending_plan IS 'Plan that will be activated at next billing cycle';
COMMENT ON COLUMN user_subscriptions.pending_billing_interval IS 'Billing interval that will be activated at next billing cycle';