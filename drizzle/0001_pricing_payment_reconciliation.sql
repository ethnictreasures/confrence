ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS base_fee_paise integer,
  ADD COLUMN IF NOT EXISTS gst_rate numeric(5, 2),
  ADD COLUMN IF NOT EXISTS gst_amount_paise integer,
  ADD COLUMN IF NOT EXISTS total_amount_paise integer,
  ADD COLUMN IF NOT EXISTS payment_reconciliation_status varchar(30) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS amount_paid_paise integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_completed_at timestamp;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS amount_paise integer,
  ADD COLUMN IF NOT EXISTS refunded_amount_paise integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_registrations_reconciliation_status
  ON registrations (payment_reconciliation_status);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_event_id varchar(255) NOT NULL UNIQUE,
  event_type varchar(100) NOT NULL,
  payment_link_id varchar(255),
  razorpay_payment_id varchar(255),
  amount_paise integer,
  currency varchar(3),
  payer_email varchar(255),
  payer_phone varchar(30),
  registration_id uuid REFERENCES registrations(id) ON DELETE SET NULL,
  reconciliation_status varchar(30) NOT NULL DEFAULT 'unresolved',
  reconciliation_reason text,
  reconciled_by uuid REFERENCES admins(id) ON DELETE SET NULL,
  reconciled_at timestamp,
  raw_event jsonb NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_payment_id
  ON payment_webhook_events (razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_reconciliation_status
  ON payment_webhook_events (reconciliation_status);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_registration_id
  ON payment_webhook_events (registration_id);

CREATE INDEX IF NOT EXISTS idx_payments_payment_status
  ON payments (payment_status);

CREATE TABLE IF NOT EXISTS payment_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  razorpay_refund_id varchar(255) NOT NULL UNIQUE,
  amount_paise integer NOT NULL,
  status varchar(20) NOT NULL,
  webhook_event_id varchar(255) NOT NULL UNIQUE,
  raw_event jsonb NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment_id
  ON payment_refunds (payment_id);