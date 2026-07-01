-- ================================================
-- 007_loan_marketplace.sql
-- Trustline Loan Marketplace — Module 13
-- ================================================

-- Lender accounts
CREATE TABLE IF NOT EXISTS lenders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  company_type text NOT NULL CHECK (company_type IN ('microfinance_bank', 'digital_lender', 'cooperative', 'credit_union', 'other')),
  registration_number text NOT NULL,
  cbn_license_number text,
  website text,
  logo_url text,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  headquarters_location text NOT NULL,
  operating_regions jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'suspended', 'rejected')),
  rejection_reason text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_profile_id uuid REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_lenders_status ON lenders(status);
CREATE INDEX IF NOT EXISTS idx_lenders_created_by ON lenders(created_by_profile_id);

-- Lender admin users (staff who manage the lender account)
CREATE TABLE IF NOT EXISTS lender_admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id uuid NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id),
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'viewer')),
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(lender_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_lender_admin_users_profile ON lender_admin_users(profile_id);
CREATE INDEX IF NOT EXISTS idx_lender_admin_users_lender ON lender_admin_users(lender_id);

-- Loan products listed by lenders
CREATE TABLE IF NOT EXISTS loan_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id uuid NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  minimum_amount numeric NOT NULL CHECK (minimum_amount > 0),
  maximum_amount numeric NOT NULL CHECK (maximum_amount > 0),
  currency text NOT NULL DEFAULT 'NGN',
  interest_rate numeric NOT NULL CHECK (interest_rate >= 0),
  interest_type text NOT NULL CHECK (interest_type IN ('flat', 'reducing_balance')),
  minimum_tenure_days integer NOT NULL CHECK (minimum_tenure_days > 0),
  maximum_tenure_days integer NOT NULL CHECK (maximum_tenure_days > 0),
  repayment_frequency text NOT NULL CHECK (repayment_frequency IN ('daily', 'weekly', 'monthly', 'end_of_tenure')),
  collateral_required boolean NOT NULL DEFAULT false,
  collateral_description text,
  minimum_trust_score numeric NOT NULL DEFAULT 0 CHECK (minimum_trust_score >= 0 AND minimum_trust_score <= 100),
  minimum_kyc_tier integer NOT NULL DEFAULT 1 CHECK (minimum_kyc_tier >= 1 AND minimum_kyc_tier <= 3),
  minimum_months_active integer NOT NULL DEFAULT 0,
  target_user_roles jsonb NOT NULL DEFAULT '["trader","service_provider","group_member"]'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  processing_fee numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_products_lender ON loan_products(lender_id);
CREATE INDEX IF NOT EXISTS idx_loan_products_active ON loan_products(is_active, is_featured);

-- Loan applications from users
CREATE TABLE IF NOT EXISTS loan_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_product_id uuid NOT NULL REFERENCES loan_products(id),
  lender_id uuid NOT NULL REFERENCES lenders(id),
  applicant_profile_id uuid NOT NULL REFERENCES profiles(id),
  requested_amount numeric NOT NULL CHECK (requested_amount > 0),
  requested_tenure_days integer NOT NULL CHECK (requested_tenure_days > 0),
  purpose text NOT NULL,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'disbursed', 'repaying', 'completed', 'defaulted')),
  trust_snapshot jsonb,
  kyc_tier_at_application integer,
  approved_amount numeric,
  approved_tenure_days integer,
  approved_interest_rate numeric,
  rejection_reason text,
  lender_notes text,
  disbursed_at timestamptz,
  expected_repayment_date date,
  trustline_fee_amount numeric,
  trustline_fee_status text CHECK (trustline_fee_status IS NULL OR trustline_fee_status IN ('pending', 'invoiced', 'paid')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_applications_applicant ON loan_applications(applicant_profile_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_lender ON loan_applications(lender_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_product ON loan_applications(loan_product_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);

-- Repayment tracking
CREATE TABLE IF NOT EXISTS loan_repayments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_application_id uuid NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('bank_transfer', 'ussd', 'cash', 'trustline_p2p')),
  provider_reference text,
  recorded_by text NOT NULL CHECK (recorded_by IN ('lender', 'user')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_repayments_application ON loan_repayments(loan_application_id);

-- Marketplace configuration (single row)
CREATE TABLE IF NOT EXISTS marketplace_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origination_fee_percentage numeric NOT NULL DEFAULT 2.5,
  featured_product_fee_monthly numeric NOT NULL DEFAULT 0,
  minimum_lender_listing_fee_monthly numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed the single config row if not exists
INSERT INTO marketplace_config (origination_fee_percentage, featured_product_fee_monthly, minimum_lender_listing_fee_monthly)
SELECT 2.5, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM marketplace_config);

-- Lender fee invoices
CREATE TABLE IF NOT EXISTS lender_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id uuid NOT NULL REFERENCES lenders(id),
  invoice_number text NOT NULL UNIQUE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid')),
  due_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lender_invoices_lender ON lender_invoices(lender_id);

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================

ALTER TABLE lenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_invoices ENABLE ROW LEVEL SECURITY;

-- Lenders: admin users of that lender can read/update their own; anyone can read approved lenders
CREATE POLICY "Lenders: public read approved" ON lenders
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Lenders: admin users read own" ON lenders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM lender_admin_users WHERE lender_admin_users.lender_id = lenders.id AND lender_admin_users.profile_id = auth.uid())
  );

CREATE POLICY "Lenders: creator can insert" ON lenders
  FOR INSERT WITH CHECK (created_by_profile_id = auth.uid());

CREATE POLICY "Lenders: admin users update own" ON lenders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM lender_admin_users WHERE lender_admin_users.lender_id = lenders.id AND lender_admin_users.profile_id = auth.uid() AND lender_admin_users.role IN ('owner', 'manager'))
  );

-- Lender admin users: members of a lender can see their own team
CREATE POLICY "Lender admins: read own team" ON lender_admin_users
  FOR SELECT USING (profile_id = auth.uid() OR lender_id IN (SELECT lender_id FROM lender_admin_users AS lau WHERE lau.profile_id = auth.uid()));

CREATE POLICY "Lender admins: owner can insert" ON lender_admin_users
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM lender_admin_users AS lau WHERE lau.lender_id = lender_admin_users.lender_id AND lau.profile_id = auth.uid() AND lau.role = 'owner')
    OR NOT EXISTS (SELECT 1 FROM lender_admin_users AS lau WHERE lau.lender_id = lender_admin_users.lender_id)
  );

-- Loan products: lender admins CRUD their own; users read active from approved lenders
CREATE POLICY "Loan products: public read active" ON loan_products
  FOR SELECT USING (
    is_active = true AND EXISTS (SELECT 1 FROM lenders WHERE lenders.id = loan_products.lender_id AND lenders.status = 'approved')
  );

CREATE POLICY "Loan products: lender admin read own" ON loan_products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM lender_admin_users WHERE lender_admin_users.lender_id = loan_products.lender_id AND lender_admin_users.profile_id = auth.uid())
  );

CREATE POLICY "Loan products: lender admin insert" ON loan_products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM lender_admin_users WHERE lender_admin_users.lender_id = loan_products.lender_id AND lender_admin_users.profile_id = auth.uid() AND lender_admin_users.role IN ('owner', 'manager'))
  );

CREATE POLICY "Loan products: lender admin update" ON loan_products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM lender_admin_users WHERE lender_admin_users.lender_id = loan_products.lender_id AND lender_admin_users.profile_id = auth.uid() AND lender_admin_users.role IN ('owner', 'manager'))
  );

CREATE POLICY "Loan products: lender admin delete" ON loan_products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM lender_admin_users WHERE lender_admin_users.lender_id = loan_products.lender_id AND lender_admin_users.profile_id = auth.uid() AND lender_admin_users.role = 'owner')
  );

-- Loan applications: applicant reads own; lender admin reads their lender's applications
CREATE POLICY "Loan apps: applicant read own" ON loan_applications
  FOR SELECT USING (applicant_profile_id = auth.uid());

CREATE POLICY "Loan apps: lender admin read own" ON loan_applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM lender_admin_users WHERE lender_admin_users.lender_id = loan_applications.lender_id AND lender_admin_users.profile_id = auth.uid())
  );

CREATE POLICY "Loan apps: user can insert" ON loan_applications
  FOR INSERT WITH CHECK (applicant_profile_id = auth.uid());

CREATE POLICY "Loan apps: lender admin update" ON loan_applications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM lender_admin_users WHERE lender_admin_users.lender_id = loan_applications.lender_id AND lender_admin_users.profile_id = auth.uid() AND lender_admin_users.role IN ('owner', 'manager'))
  );

-- Loan repayments: applicant and lender can both read
CREATE POLICY "Repayments: applicant read" ON loan_repayments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM loan_applications WHERE loan_applications.id = loan_repayments.loan_application_id AND loan_applications.applicant_profile_id = auth.uid())
  );

CREATE POLICY "Repayments: lender read" ON loan_repayments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM loan_applications la
      JOIN lender_admin_users lau ON lau.lender_id = la.lender_id
      WHERE la.id = loan_repayments.loan_application_id AND lau.profile_id = auth.uid()
    )
  );

CREATE POLICY "Repayments: user can insert" ON loan_repayments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM loan_applications WHERE loan_applications.id = loan_repayments.loan_application_id AND loan_applications.applicant_profile_id = auth.uid())
  );

CREATE POLICY "Repayments: lender can insert" ON loan_repayments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM loan_applications la
      JOIN lender_admin_users lau ON lau.lender_id = la.lender_id
      WHERE la.id = loan_repayments.loan_application_id AND lau.profile_id = auth.uid()
    )
  );

-- Marketplace config: anyone can read (fee transparency)
CREATE POLICY "Marketplace config: public read" ON marketplace_config
  FOR SELECT USING (true);

-- Lender invoices: lender admins read own
CREATE POLICY "Lender invoices: admin read own" ON lender_invoices
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM lender_admin_users WHERE lender_admin_users.lender_id = lender_invoices.lender_id AND lender_admin_users.profile_id = auth.uid())
  );
