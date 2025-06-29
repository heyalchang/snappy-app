-- Add persona fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS persona TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 13 AND age <= 100),
ADD COLUMN IF NOT EXISTS messaging_goals TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.persona IS 'AI-generated 2-sentence background/personality description';
COMMENT ON COLUMN profiles.age IS 'User age for context in AI responses';
COMMENT ON COLUMN profiles.messaging_goals IS 'Personality traits and goals for AI message generation';