-- Reset dylanvw2002@gmail.com account to free plan
UPDATE user_subscriptions 
SET 
  plan = 'free'::subscription_plan, 
  status = 'active'::subscription_status,
  max_organizations = 1,
  max_members_per_org = 2,
  billing_interval = NULL,
  current_period_start = NULL,
  current_period_end = NULL,
  mollie_subscription_id = NULL,
  price_excl_vat = NULL,
  price_incl_vat = NULL,
  vat_amount = NULL,
  vat_rate = NULL,
  pending_plan = NULL,
  pending_billing_interval = NULL
WHERE user_id = 'fe897de0-d2be-4141-aec1-68061e1c3c7b';