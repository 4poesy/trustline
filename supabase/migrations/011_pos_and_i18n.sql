-- ALTER PROFILES TABLE TO ADD COUNTRY, LANGUAGE, AND POS OPERATOR COLUMNS
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS pos_operator boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pos_terminal_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pos_bank_provider text,
  ADD COLUMN IF NOT EXISTS pos_location_description text,
  ADD COLUMN IF NOT EXISTS language_code text DEFAULT 'en-NG',
  ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'NG',
  ADD COLUMN IF NOT EXISTS currency_code text DEFAULT 'NGN',
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Africa/Lagos';

-- CREATE COUNTRIES TABLE
CREATE TABLE IF NOT EXISTS countries (
  code text PRIMARY KEY,
  name text NOT NULL,
  currency_code text NOT NULL,
  currency_symbol text NOT NULL,
  currency_name text NOT NULL,
  phone_country_code text NOT NULL,
  default_language text NOT NULL,
  date_format text NOT NULL DEFAULT 'DD/MM/YYYY',
  number_format text NOT NULL DEFAULT 'en-NG',
  is_active boolean NOT NULL DEFAULT false,
  is_beta boolean NOT NULL DEFAULT false,
  supported_id_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  payment_providers jsonb NOT NULL DEFAULT '[]'::jsonb,
  pos_culture boolean NOT NULL DEFAULT false,
  timezone text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- CREATE LANGUAGES TABLE
CREATE TABLE IF NOT EXISTS languages (
  code text PRIMARY KEY,
  name text NOT NULL,
  is_rtl boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT false,
  completion_percentage integer NOT NULL DEFAULT 0
);

-- CREATE TRANSLATIONS TABLE
CREATE TABLE IF NOT EXISTS translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code text REFERENCES languages(code) ON DELETE CASCADE,
  translation_key text NOT NULL,
  translation_value text NOT NULL,
  last_updated_at timestamptz DEFAULT now(),
  updated_by text DEFAULT 'system',
  CONSTRAINT translations_language_key_unique UNIQUE (language_code, translation_key)
);

-- CREATE POS TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS pos_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN (
    'cash_withdrawal', 'bank_transfer', 'airtime_purchase', 'bill_payment',
    'account_opening', 'balance_enquiry', 'other'
  )),
  customer_amount numeric NOT NULL,
  fee_charged numeric NOT NULL,
  fee_waived boolean NOT NULL DEFAULT false,
  terminal_id text,
  note text,
  entry_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz
);

-- CREATE POS FLOAT TRACKER TABLE
CREATE TABLE IF NOT EXISTS pos_float_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  cash_on_hand numeric NOT NULL DEFAULT 0,
  bank_balance numeric NOT NULL DEFAULT 0,
  minimum_float_needed numeric,
  last_updated_at timestamptz DEFAULT now(),
  currency text NOT NULL DEFAULT 'NGN'
);

-- Enable RLS
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_float_tracker ENABLE ROW LEVEL SECURITY;

-- Drop Policies if they exist (for rerun safety)
DROP POLICY IF EXISTS "Public read countries" ON countries;
DROP POLICY IF EXISTS "Public read languages" ON languages;
DROP POLICY IF EXISTS "Public read translations" ON translations;
DROP POLICY IF EXISTS "Own pos transactions" ON pos_transactions;
DROP POLICY IF EXISTS "Own pos float tracker" ON pos_float_tracker;

-- RLS Policies
CREATE POLICY "Public read countries" ON countries FOR SELECT USING (true);
CREATE POLICY "Public read languages" ON languages FOR SELECT USING (true);
CREATE POLICY "Public read translations" ON translations FOR SELECT USING (true);
CREATE POLICY "Own pos transactions" ON pos_transactions FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Own pos float tracker" ON pos_float_tracker FOR ALL USING (auth.uid() = profile_id);

-- SEED COUNTRIES DATA
INSERT INTO countries (code, name, currency_code, currency_symbol, currency_name, phone_country_code, default_language, date_format, number_format, is_active, is_beta, supported_id_types, payment_providers, pos_culture, timezone) VALUES
('NG', 'Nigeria', 'NGN', '₦', 'Nigerian Naira', '+234', 'en-NG', 'DD/MM/YYYY', 'en-NG', true, false, '["BVN","NIN","voters_card","drivers_license","passport"]', '["paystack","flutterwave","opay","moniepoint"]', true, 'Africa/Lagos'),
('GH', 'Ghana', 'GHS', 'GH₵', 'Ghanaian Cedi', '+233', 'en-GH', 'DD/MM/YYYY', 'en-GH', true, true, '["ghana_card","passport","voters_id"]', '["mtn_momo","flutterwave","paystack"]', false, 'Africa/Accra'),
('KE', 'Kenya', 'KES', 'KSh', 'Kenyan Shilling', '+254', 'en-KE', 'DD/MM/YYYY', 'en-KE', true, true, '["national_id","passport","kra_pin"]', '["mpesa","flutterwave"]', false, 'Africa/Nairobi'),
('TZ', 'Tanzania', 'TZS', 'TSh', 'Tanzanian Shilling', '+255', 'sw', 'DD/MM/YYYY', 'sw-TZ', false, true, '["national_id","passport","voters_id"]', '["mpesa","tigopesa","flutterwave"]', false, 'Africa/Dar_es_Salaam'),
('ZA', 'South Africa', 'ZAR', 'R', 'South African Rand', '+27', 'en-ZA', 'YYYY/MM/DD', 'en-ZA', false, true, '["id_book","smart_id","passport"]', '["payfast","flutterwave","ozow"]', false, 'Africa/Johannesburg'),
('SN', 'Senegal', 'XOF', 'CFA', 'West African CFA Franc', '+221', 'fr', 'DD/MM/YYYY', 'fr-SN', false, false, '["national_id","passport"]', '["orange_money","wave","flutterwave"]', false, 'Africa/Dakar'),
('CI', 'Côte d''Ivoire', 'XOF', 'CFA', 'West African CFA Franc', '+225', 'fr', 'DD/MM/YYYY', 'fr-CI', false, false, '["national_id","passport"]', '["orange_money","mtn_momo","wave"]', false, 'Africa/Abidjan')
ON CONFLICT (code) DO UPDATE SET 
  is_active = EXCLUDED.is_active,
  is_beta = EXCLUDED.is_beta,
  supported_id_types = EXCLUDED.supported_id_types,
  payment_providers = EXCLUDED.payment_providers;

-- SEED LANGUAGES DATA
INSERT INTO languages (code, name, is_rtl, is_active, completion_percentage) VALUES
('en-NG', 'English (Nigeria)', false, true, 100),
('en-GH', 'English (Ghana)', false, true, 95),
('en-KE', 'English (Kenya)', false, false, 60),
('sw', 'Swahili', false, false, 20),
('fr', 'French', false, false, 10),
('pcm', 'Pidgin (Nigeria)', false, false, 30)
ON CONFLICT (code) DO UPDATE SET 
  is_active = EXCLUDED.is_active,
  completion_percentage = EXCLUDED.completion_percentage;

-- REMOVE TRANSACTIONS CATEGORY CHECK CONSTRAINT TO ALLOW FLEXIBLE CATEGORIES LIKE 'POS Fee'
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_category_check;

-- AUTOMATIC SYNC FROM POS_TRANSACTIONS TO TRANSACTIONS FUNCTION
CREATE OR REPLACE FUNCTION sync_pos_fee_to_transactions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fee_charged > 0 THEN
    INSERT INTO transactions (
      id,
      profile_id,
      type,
      amount,
      category,
      entry_date,
      note,
      created_at
    ) VALUES (
      NEW.id, -- share same uuid for tracking reference
      NEW.profile_id,
      'income',
      NEW.fee_charged,
      'POS Fee',
      NEW.entry_date,
      'POS fee — ₦' || TO_CHAR(NEW.customer_amount, 'FM999,999,999') || ' ' || NEW.transaction_type,
      NEW.created_at
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER FOR POS TRANSACTION FEE AUTO INSERT
CREATE OR REPLACE TRIGGER pos_fee_sync_trigger
AFTER INSERT ON pos_transactions
FOR EACH ROW
EXECUTE FUNCTION sync_pos_fee_to_transactions();

-- SEED ENGLISH TRANSLATIONS
INSERT INTO translations (language_code, translation_key, translation_value) VALUES
('en-NG', 'auth.login.title', 'Welcome back'),
('en-NG', 'auth.login.code_placeholder', 'Enter Trustline Code'),
('en-NG', 'auth.login.pin_placeholder', 'Enter 4-Digit PIN'),
('en-NG', 'auth.login.submit_button', 'Log In'),
('en-NG', 'auth.login.forgot_code', 'Forgot Code?'),
('en-NG', 'auth.signup.step1_title', 'Create Account'),
('en-NG', 'auth.signup.role_trader', 'Market Trader'),
('en-NG', 'auth.signup.role_service_provider', 'Service Provider'),
('en-NG', 'auth.signup.role_group_member', 'Ajo / Esusu Saver'),
('en-NG', 'auth.signup.role_pos_operator', 'POS Business Operator'),
('en-NG', 'auth.code_reveal.title', 'Save your Code'),
('en-NG', 'auth.code_reveal.warning_message', 'Keep this code safe. Never share it with anyone.'),
('en-NG', 'auth.code_reveal.save_confirmation', 'I have securely stored my code'),
('en-NG', 'cashflow.add.title', 'Add Transaction'),
('en-NG', 'cashflow.add.income_label', 'Money In'),
('en-NG', 'cashflow.add.expense_label', 'Money Out'),
('en-NG', 'cashflow.add.amount_placeholder', 'Amount'),
('en-NG', 'cashflow.add.category_sales', 'Sales'),
('en-NG', 'cashflow.add.category_supplies', 'Supplies'),
('en-NG', 'cashflow.add.save_button', 'Save Entry'),
('en-NG', 'pos.log.title', 'Log POS Transaction'),
('en-NG', 'pos.log.withdrawal_type', 'Cash Withdrawal'),
('en-NG', 'pos.log.customer_amount_label', 'Customer Amount'),
('en-NG', 'pos.log.fee_label', 'Fee Charged'),
('en-NG', 'pos.float.title', 'Float Status'),
('en-NG', 'pos.float.cash_on_hand', 'Cash on Hand'),
('en-NG', 'pos.float.bank_balance', 'Bank Settlement Balance'),
('en-NG', 'planner.add.title', 'Add Task'),
('en-NG', 'planner.add.type_personal', 'Personal'),
('en-NG', 'planner.add.type_prayer', 'Prayer'),
('en-NG', 'planner.add.type_financial', 'Financial'),
('en-NG', 'common.save', 'Save'),
('en-NG', 'common.cancel', 'Cancel'),
('en-NG', 'common.loading', 'Loading...'),
('en-NG', 'common.offline_banner', 'Offline Mode'),
('en-NG', 'common.currency_format', '₦'),
('en-NG', 'common.date_format', 'DD/MM/YYYY'),
('en-NG', 'errors.invalid_credentials', 'Invalid code or PIN'),
('en-NG', 'errors.account_locked', 'Account locked for security'),
('en-NG', 'errors.network_error', 'Connection issue. Saved locally.'),
('en-NG', 'errors.field_required', 'This field is required'),
('en-NG', 'errors.pin_too_simple', 'Choose a stronger PIN')
ON CONFLICT (language_code, translation_key) DO UPDATE SET 
  translation_value = EXCLUDED.translation_value,
  last_updated_at = now();
