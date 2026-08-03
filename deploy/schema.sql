-- Ayyappan Temple — full database schema
-- Idempotent: safe to run on an existing database (CREATE IF NOT EXISTS, INSERT … ON CONFLICT DO NOTHING)
-- Run automatically by deploy.sh on every deploy.

CREATE TABLE IF NOT EXISTS admins (
  id              SERIAL PRIMARY KEY,
  username        VARCHAR(100) UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  role            VARCHAR(20) NOT NULL DEFAULT 'editor',
  display_name    VARCHAR(200),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_login      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS news_posts (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  image_url   TEXT,
  video_url   TEXT,
  published   BOOLEAN DEFAULT TRUE,
  created_by  INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  event_type   VARCHAR(50),
  description  TEXT,
  event_date   TIMESTAMPTZ NOT NULL,
  location     TEXT,
  poster_url   TEXT,
  published    BOOLEAN DEFAULT TRUE,
  created_by   INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery_albums (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  cover_url    TEXT,
  sort_order   INTEGER DEFAULT 0,
  published    BOOLEAN DEFAULT TRUE,
  created_by   INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery_photos (
  id          SERIAL PRIMARY KEY,
  album_id    INTEGER,
  url         TEXT NOT NULL,
  caption     TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donations (
  id               SERIAL PRIMARY KEY,
  receipt_token    TEXT,
  donor_name       VARCHAR(200) NOT NULL,
  mobile           VARCHAR(20) NOT NULL,
  place            VARCHAR(200),
  amount           NUMERIC(12,2) NOT NULL,
  transaction_id   VARCHAR(200) NOT NULL,
  screenshot_url   TEXT,
  anonymous        BOOLEAN DEFAULT FALSE,
  message          TEXT,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by      INTEGER,
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS donations_transaction_id_idx ON donations(transaction_id);

CREATE TABLE IF NOT EXISTS site_settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       TEXT,
  updated_by  INTEGER,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id           SERIAL PRIMARY KEY,
  admin_id     INTEGER,
  action       TEXT NOT NULL,
  entity_type  VARCHAR(50),
  entity_id    INTEGER,
  details      JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS in_kind_contributions (
  id              SERIAL PRIMARY KEY,
  receipt_token   TEXT UNIQUE,
  donor_name      VARCHAR(200) NOT NULL,
  place           VARCHAR(200),
  description     TEXT NOT NULL,
  contributed_at  TIMESTAMPTZ DEFAULT NOW(),
  created_by      INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  is_active       BOOLEAN DEFAULT TRUE
);

-- Session store (connect-pg-simple / express-session)
CREATE TABLE IF NOT EXISTS sessions (
  sid    VARCHAR        NOT NULL COLLATE "default",
  sess   JSON           NOT NULL,
  expire TIMESTAMP(6)   NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
) WITH (OIDS=FALSE);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);

CREATE TABLE IF NOT EXISTS visits (
  id          SERIAL PRIMARY KEY,
  day_key     VARCHAR(10) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS visits_day_key_idx ON visits(day_key);
CREATE INDEX IF NOT EXISTS visits_created_at_idx ON visits(created_at DESC);

-- ── Column migrations (idempotent — ADD COLUMN IF NOT EXISTS) ───────────────
-- receipt_token was added after initial deployment; safe to re-run on any DB.
ALTER TABLE donations           ADD COLUMN IF NOT EXISTS receipt_token TEXT;
ALTER TABLE in_kind_contributions ADD COLUMN IF NOT EXISTS receipt_token TEXT;

-- Ensure the UNIQUE constraint exists on in_kind_contributions.receipt_token.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'in_kind_contributions'::regclass
      AND contype = 'u'
      AND conname = 'in_kind_contributions_receipt_token_key'
  ) THEN
    ALTER TABLE in_kind_contributions ADD CONSTRAINT in_kind_contributions_receipt_token_key UNIQUE (receipt_token);
  END IF;
END $$;

-- ── Default site settings (INSERT … ON CONFLICT DO NOTHING = never overwrites) ──
INSERT INTO site_settings (key, value) VALUES
  ('temple_name',       'அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்'),
  ('temple_location',   'வடமதுரை, திண்டுக்கல்'),
  ('temple_phone',      ''),
  ('support_phone',     ''),
  ('bank_name',         ''),
  ('bank_account_name', ''),
  ('bank_account_number', ''),
  ('bank_ifsc',         ''),
  ('bank_branch',       ''),
  ('bank_account_type', ''),
  ('bank_help_phone',   ''),
  ('bank_upi_id',       ''),
  ('gpay_number',       '')
ON CONFLICT (key) DO NOTHING;

-- IOB bank details — fills in empty values only; never overwrites what admin has saved
INSERT INTO site_settings (key, value) VALUES
  ('bank_name',           'Indian Overseas Bank (IOB)'),
  ('bank_account_name',   'Mr. N. Anand'),
  ('bank_account_number', '246101000019314'),
  ('bank_ifsc',           'IOBA0002461'),
  ('bank_branch',         'Vadamadurai Branch (2461)'),
  ('bank_account_type',   'Savings Bank (SB)'),
  ('bank_help_phone',     '9345127734')
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value
  WHERE site_settings.value IS NULL OR site_settings.value = '';
