-- Isolated sandbox data. No existing application tables are changed.
CREATE SCHEMA IF NOT EXISTS simbiat_checkout_test;
CREATE TABLE IF NOT EXISTS simbiat_checkout_test.stock (
  variant_id text PRIMARY KEY,
  on_hand integer NOT NULL CHECK (on_hand >= 0),
  reserved integer NOT NULL DEFAULT 0 CHECK (reserved >= 0 AND reserved <= on_hand)
);
CREATE TABLE IF NOT EXISTS simbiat_checkout_test.orders (
  id uuid PRIMARY KEY,
  cart_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'review')),
  quote jsonb NOT NULL,
  stripe_params jsonb NOT NULL,
  session_id text UNIQUE,
  checkout_url text,
  payment_id text UNIQUE,
  customer_details jsonb,
  shipping_details jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS simbiat_checkout_test.events (
  id text PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES simbiat_checkout_test.orders(id),
  type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pending_checkout_orders ON simbiat_checkout_test.orders(created_at) WHERE status = 'pending';
ALTER TABLE simbiat_checkout_test.orders ADD COLUMN IF NOT EXISTS fulfilled_at timestamptz;
ALTER TABLE simbiat_checkout_test.orders ADD COLUMN IF NOT EXISTS last_reconciled_at timestamptz;
CREATE TABLE IF NOT EXISTS simbiat_checkout_test.owner_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor text NOT NULL,
  action text NOT NULL,
  reference text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
