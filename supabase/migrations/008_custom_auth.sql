-- Migration 008: Custom Auth & Profile (REWRITTEN)

-- Drop constraint referencing auth.users if it exists to allow custom generated UUIDs
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Make phone_number nullable (not needed with custom code + PIN auth)
ALTER TABLE profiles ALTER COLUMN phone_number DROP NOT NULL;

-- Add new auth columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trustline_code text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pin_hash text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_last4 text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_username text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS recovery_answer_hash text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS recovery_question text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'NG';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS currency text DEFAULT 'NGN';

-- If there are existing records, migrate them with a safe dummy code and dummy hash
UPDATE profiles SET trustline_code = 'TL-MIG-' || substring(id::text, 1, 4) || '-' || substring(id::text, 5, 4) WHERE trustline_code IS NULL;
UPDATE profiles SET pin_hash = '$2b$12$4poesy/trustline365/placeholderhash' WHERE pin_hash IS NULL;

-- Now set trustline_code and pin_hash to NOT NULL
ALTER TABLE profiles ALTER COLUMN trustline_code SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN pin_hash SET NOT NULL;

-- Table: login_attempts
CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trustline_code text,
  attempted_at timestamptz DEFAULT now(),
  success boolean,
  ip_address text
);

-- Table: account_locks
CREATE TABLE IF NOT EXISTS account_locks (
  trustline_code text PRIMARY KEY,
  failed_count integer DEFAULT 0,
  last_failed_at timestamptz,
  locked_until timestamptz
);

-- Table: sessions
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_token_hash text NOT NULL,
  device_info text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_active_at timestamptz DEFAULT now(),
  is_new_device boolean DEFAULT false
);

-- Table: code_recovery_attempts
CREATE TABLE IF NOT EXISTS code_recovery_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trustline_code_fragment text,
  attempted_at timestamptz DEFAULT now(),
  locked_until timestamptz
);

-- Enable RLS on new tables
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_recovery_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies for sessions
DROP POLICY IF EXISTS "Users can read own sessions" ON sessions;
CREATE POLICY "Users can read own sessions" ON sessions
  FOR SELECT USING (auth.uid() = profile_id);

-- Rest of access is blocked for clients (no policies for write, which defaults to deny unless service_role)

-- Auto-cleanup PostgreSQL function
CREATE OR REPLACE FUNCTION perform_auto_cleanup()
RETURNS void AS $$
BEGIN
  -- 1. Remove expired sessions
  DELETE FROM sessions WHERE expires_at < now();
  
  -- 2. Auto-unlock accounts whose lock has expired
  UPDATE account_locks
  SET failed_count = 0, locked_until = null
  WHERE locked_until IS NOT NULL AND locked_until < now();
  
  -- 3. Clean login attempts (older than 90 days)
  DELETE FROM login_attempts WHERE attempted_at < now() - interval '90 days';
  
  -- 4. Clean recovery attempts (older than 30 days)
  DELETE FROM code_recovery_attempts WHERE attempted_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
