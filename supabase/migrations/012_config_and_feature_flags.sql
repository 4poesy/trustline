-- CREATE FEATURE FLAGS TABLE
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text NOT NULL,
  country_code text REFERENCES countries(code) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT false,
  rollout_percentage integer NOT NULL DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  minimum_kyc_tier integer NOT NULL DEFAULT 0 CHECK (minimum_kyc_tier >= 0 AND minimum_kyc_tier <= 3),
  minimum_trust_score numeric NOT NULL DEFAULT 0 CHECK (minimum_trust_score >= 0 AND minimum_trust_score <= 100),
  is_beta boolean NOT NULL DEFAULT false,
  release_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by text NOT NULL DEFAULT 'system',
  CONSTRAINT feature_flags_key_country_unique UNIQUE (feature_key, country_code)
);

-- CREATE FEATURE FLAG CHANGES TABLE (AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS feature_flag_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text NOT NULL,
  country_code text,
  changed_field text NOT NULL,
  old_value text,
  new_value text,
  changed_by text NOT NULL,
  changed_at timestamptz DEFAULT now(),
  reason text
);

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_changes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for rerun safety)
DROP POLICY IF EXISTS "All users can select feature flags" ON feature_flags;
DROP POLICY IF EXISTS "All users can select feature flag changes" ON feature_flag_changes;

-- RLS Policies
CREATE POLICY "All users can select feature flags" ON feature_flags FOR SELECT USING (true);
CREATE POLICY "All users can select feature flag changes" ON feature_flag_changes FOR SELECT USING (true);

-- CREATE TRIGGER FUNCTION FOR FEATURE FLAG AUDIT LOGGING
CREATE OR REPLACE FUNCTION log_feature_flag_audit()
RETURNS TRIGGER AS $$
DECLARE
  changer text;
BEGIN
  changer := COALESCE(NEW.updated_by, OLD.updated_by, 'system');
  
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO feature_flag_changes (feature_key, country_code, changed_field, old_value, new_value, changed_by, reason)
    VALUES 
    (NEW.feature_key, NEW.country_code, 'is_enabled', NULL, NEW.is_enabled::text, changer, NEW.release_notes),
    (NEW.feature_key, NEW.country_code, 'rollout_percentage', NULL, NEW.rollout_percentage::text, changer, NEW.release_notes),
    (NEW.feature_key, NEW.country_code, 'minimum_kyc_tier', NULL, NEW.minimum_kyc_tier::text, changer, NEW.release_notes);
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.is_enabled IS DISTINCT FROM NEW.is_enabled THEN
      INSERT INTO feature_flag_changes (feature_key, country_code, changed_field, old_value, new_value, changed_by, reason)
      VALUES (NEW.feature_key, NEW.country_code, 'is_enabled', OLD.is_enabled::text, NEW.is_enabled::text, changer, NEW.release_notes);
    END IF;
    IF OLD.rollout_percentage IS DISTINCT FROM NEW.rollout_percentage THEN
      INSERT INTO feature_flag_changes (feature_key, country_code, changed_field, old_value, new_value, changed_by, reason)
      VALUES (NEW.feature_key, NEW.country_code, 'rollout_percentage', OLD.rollout_percentage::text, NEW.rollout_percentage::text, changer, NEW.release_notes);
    END IF;
    IF OLD.minimum_kyc_tier IS DISTINCT FROM NEW.minimum_kyc_tier THEN
      INSERT INTO feature_flag_changes (feature_key, country_code, changed_field, old_value, new_value, changed_by, reason)
      VALUES (NEW.feature_key, NEW.country_code, 'minimum_kyc_tier', OLD.minimum_kyc_tier::text, NEW.minimum_kyc_tier::text, changer, NEW.release_notes);
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO feature_flag_changes (feature_key, country_code, changed_field, old_value, new_value, changed_by, reason)
    VALUES (OLD.feature_key, OLD.country_code, 'status', 'active', 'deleted', changer, 'Flag deleted');
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- CREATE TRIGGER
DROP TRIGGER IF EXISTS feature_flags_audit_trig ON feature_flags;
CREATE TRIGGER feature_flags_audit_trig
AFTER INSERT OR UPDATE OR DELETE ON feature_flags
FOR EACH ROW
EXECUTE FUNCTION log_feature_flag_audit();

-- SEED DATA - GLOBAL DEFAULTS (country_code = NULL)
INSERT INTO feature_flags (feature_key, country_code, is_enabled, rollout_percentage, minimum_kyc_tier, is_beta, release_notes) VALUES
('cashflow_tracker',    NULL, true,  100, 0, false, 'Core cashflow tracking'),
('trust_directory',     NULL, true,  100, 0, false, 'Public profile directory'),
('savings_groups',      NULL, true,  100, 0, false, 'Savings group Ajo features'),
('smart_planner',       NULL, true,  100, 0, false, 'Daily itinerary planner'),
('invoice_generation',  NULL, true,  100, 0, false, 'Invoice creation tool'),
('credit_score_export', NULL, true,  100, 1, false, 'Export credit score report'),
('business_insights',   NULL, true,  100, 0, false, 'Reputation insights'),
('agent_network',       NULL, true,  100, 1, false, 'Access agent features'),
('bill_payments',       NULL, true,  100, 0, true,  'Airtime and utility bills'),
('p2p_transfers',       NULL, false, 100, 1, false, 'Peer to Peer wallet transfers'),
('qr_payments',         NULL, false, 100, 0, true,  'Scan to pay QR features'),
('pos_business_mode',   NULL, false, 100, 0, false, 'POS Operator workspace mode'),
('loan_marketplace',    NULL, false, 100, 1, false, 'Loan discovery marketplace'),
('micro_insurance',     NULL, false, 100, 1, false, 'Micro-insurance packages'),
('open_api',            NULL, false, 100, 2, false, 'Developer API integrations'),
('group_commerce',      NULL, false, 100, 0, true,  'Group purchasing capabilities'),
('cross_border_payments', NULL, false, 100, 3, false, 'Cross border remittances'),
('multi_currency',      NULL, true,  100, 0, false, 'Display currency formatting'),
('prayer_reminders',    NULL, false, 100, 0, false, 'Islam/Christian prayer logs'),
('weather_alerts',      NULL, false, 100, 0, false, 'Weather forecasts for traders'),
('kyc_bvn_nin',         NULL, false, 100, 0, false, 'Nigeria BVN/NIN validation'),
('kyc_ghana_card',      NULL, false, 100, 0, false, 'Ghana card validation'),
('kyc_kenya_id',        NULL, false, 100, 0, false, 'Kenya National ID validation'),
('mpesa_payments',      NULL, false, 100, 0, false, 'M-Pesa payment gateway integration'),
('mtn_momo_payments',   NULL, false, 100, 0, false, 'MTN MoMo payments integration')
ON CONFLICT (feature_key, country_code) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  rollout_percentage = EXCLUDED.rollout_percentage,
  minimum_kyc_tier = EXCLUDED.minimum_kyc_tier,
  is_beta = EXCLUDED.is_beta;

-- SEED DATA - NIGERIA OVERRIDES (country_code = 'NG')
INSERT INTO feature_flags (feature_key, country_code, is_enabled, rollout_percentage, minimum_kyc_tier, is_beta, release_notes) VALUES
('pos_business_mode',   'NG', true,  100, 0, false, 'POS is highly popular in NG'),
('kyc_bvn_nin',         'NG', true,  100, 0, false, 'BVN/NIN verification'),
('loan_marketplace',    'NG', true,   10, 1, true,  'Beta test loans for 10% of users'),
('bill_payments',       'NG', true,  100, 0, false, 'Full bills launch in NG'),
('p2p_transfers',       'NG', true,  100, 1, false, 'P2P enabled for KYC tier 1+'),
('qr_payments',         'NG', true,  100, 0, false, 'QR enabled in NG')
ON CONFLICT (feature_key, country_code) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  rollout_percentage = EXCLUDED.rollout_percentage,
  minimum_kyc_tier = EXCLUDED.minimum_kyc_tier,
  is_beta = EXCLUDED.is_beta;

-- SEED DATA - GHANA OVERRIDES (country_code = 'GH')
INSERT INTO feature_flags (feature_key, country_code, is_enabled, rollout_percentage, minimum_kyc_tier, is_beta, release_notes) VALUES
('kyc_ghana_card',      'GH', true,  100, 0, true,  'Ghana card KYC verification'),
('mtn_momo_payments',   'GH', true,  100, 0, true,  'MTN Mobile Money in GH'),
('bill_payments',       'GH', true,   50, 0, true,  '50% rollout for GH bills'),
('pos_business_mode',   'GH', false, 100, 0, false, 'Not applicable in Ghana')
ON CONFLICT (feature_key, country_code) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  rollout_percentage = EXCLUDED.rollout_percentage,
  minimum_kyc_tier = EXCLUDED.minimum_kyc_tier,
  is_beta = EXCLUDED.is_beta;

-- SEED DATA - KENYA OVERRIDES (country_code = 'KE')
INSERT INTO feature_flags (feature_key, country_code, is_enabled, rollout_percentage, minimum_kyc_tier, is_beta, release_notes) VALUES
('kyc_kenya_id',        'KE', true,  100, 0, true,  'Kenya National ID KYC'),
('mpesa_payments',      'KE', true,  100, 0, true,  'M-Pesa payment integration'),
('prayer_reminders',    'KE', true,  100, 0, false, 'Islamic & Christian prayer logs'),
('weather_alerts',      'KE', true,  100, 0, false, 'Weather updates for Kenyan outdoor traders'),
('pos_business_mode',   'KE', false, 100, 0, false, 'Not applicable in Kenya')
ON CONFLICT (feature_key, country_code) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  rollout_percentage = EXCLUDED.rollout_percentage,
  minimum_kyc_tier = EXCLUDED.minimum_kyc_tier,
  is_beta = EXCLUDED.is_beta;
