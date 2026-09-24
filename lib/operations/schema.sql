CREATE SCHEMA IF NOT EXISTS simbiat_operations;
CREATE TABLE IF NOT EXISTS simbiat_operations.contact_messages (
  id uuid PRIMARY KEY,
  fingerprint text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  handled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS simbiat_operations.subscribers (
  email text PRIMARY KEY,
  status text NOT NULL CHECK (status IN ('pending', 'subscribed', 'unsubscribed')),
  confirmation_hash text UNIQUE NOT NULL,
  unsubscribe_hash text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  consent_version text NOT NULL,
  confirmed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS simbiat_operations.mail (
  id text PRIMARY KEY,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'review')),
  attempts integer NOT NULL DEFAULT 0,
  first_attempt_at timestamptz,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_id uuid,
  lease_until timestamptz,
  provider_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
CREATE TABLE IF NOT EXISTS simbiat_operations.rate_limits (
  key text PRIMARY KEY,
  hits integer NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS mail_pending ON simbiat_operations.mail(next_attempt_at) WHERE status IN ('pending', 'sending');
