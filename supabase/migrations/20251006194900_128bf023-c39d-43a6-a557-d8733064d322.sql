-- Create enums for subscription system
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'team', 'business');
CREATE TYPE billing_interval AS ENUM ('monthly', 'yearly');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'expired', 'past_due');

-- Create user_subscriptions table
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan subscription_plan DEFAULT 'free' NOT NULL,
  billing_interval billing_interval,
  status subscription_status DEFAULT 'active' NOT NULL,
  mollie_customer_id TEXT,
  mollie_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  max_organizations INTEGER NOT NULL,
  max_members_per_org INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_subscriptions
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to get user subscription limits
CREATE OR REPLACE FUNCTION get_user_subscription_limits(_user_id UUID)
RETURNS TABLE (
  plan subscription_plan,
  max_organizations INTEGER,
  max_members_per_org INTEGER,
  current_org_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(us.plan, 'free'::subscription_plan) as plan,
    COALESCE(us.max_organizations, 1) as max_organizations,
    COALESCE(us.max_members_per_org, 2) as max_members_per_org,
    COUNT(DISTINCT m.organization_id) as current_org_count
  FROM profiles p
  LEFT JOIN user_subscriptions us ON us.user_id = p.user_id
  LEFT JOIN memberships m ON m.user_id = p.user_id
  WHERE p.user_id = _user_id
  GROUP BY us.plan, us.max_organizations, us.max_members_per_org
$$;

-- Function to check if user can create organization
CREATE OR REPLACE FUNCTION check_organization_limit(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN limits.max_organizations = -1 THEN true
      WHEN limits.current_org_count < limits.max_organizations THEN true
      ELSE false
    END
  FROM get_user_subscription_limits(_user_id) limits
$$;

-- Function to check if organization can add member
CREATE OR REPLACE FUNCTION check_member_limit(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN us.max_members_per_org = -1 THEN true
      WHEN COUNT(m.id) < us.max_members_per_org THEN true
      ELSE false
    END
  FROM memberships owner_m
  JOIN user_subscriptions us ON us.user_id = owner_m.user_id
  LEFT JOIN memberships m ON m.organization_id = _org_id
  WHERE owner_m.organization_id = _org_id
    AND owner_m.role = 'owner'
  GROUP BY us.max_members_per_org
$$;

-- Trigger function to create free subscription for new users
CREATE OR REPLACE FUNCTION handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, plan, max_organizations, max_members_per_org)
  VALUES (NEW.user_id, 'free', 1, 2);
  RETURN NEW;
END;
$$;

-- Trigger to auto-create subscription on profile creation
CREATE TRIGGER on_profile_created_subscription
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_subscription();