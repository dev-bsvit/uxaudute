-- Create user_onboarding table to store onboarding questionnaire data
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Step 1: Personal info
  first_name TEXT,
  last_name TEXT,

  -- Step 2: Role
  role TEXT CHECK (role IN ('designer', 'researcher', 'marketer', 'product_manager', 'founder_ceo', 'student', 'other')),

  -- Step 3: Interests (stored as array)
  interests TEXT[] DEFAULT '{}',

  -- Step 4: Source
  source TEXT CHECK (source IN ('linkedin', 'telegram', 'google', 'chatgpt', 'youtube', 'instagram', 'other')),

  -- Completion status
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one onboarding per user
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed ON user_onboarding(completed);

-- Enable RLS
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read their own onboarding data
CREATE POLICY "Users can view own onboarding"
  ON user_onboarding
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own onboarding data
CREATE POLICY "Users can create own onboarding"
  ON user_onboarding
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own onboarding data
CREATE POLICY "Users can update own onboarding"
  ON user_onboarding
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can read all onboarding data (you may need to adjust this based on your admin system)
-- For now, we'll comment this out and add it later when admin system is in place
-- CREATE POLICY "Admins can view all onboarding"
--   ON user_onboarding
--   FOR SELECT
--   USING (EXISTS (
--     SELECT 1 FROM profiles
--     WHERE profiles.id = auth.uid() AND profiles.is_admin = true
--   ));

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_user_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_onboarding_updated_at
  BEFORE UPDATE ON user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_user_onboarding_updated_at();
