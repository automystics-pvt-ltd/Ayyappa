-- Ayyappan Temple — full database schema
-- Run once on a fresh PostgreSQL database

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

-- Default site settings
INSERT INTO site_settings (key, value) VALUES
  ('temple_name',       'அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்'),
  ('temple_location',   'வடமதுரை, திண்டுக்கல்'),
  ('temple_phone',      ''),
  ('support_phone',     ''),
  ('bank_account_name', ''),
  ('bank_account_no',   ''),
  ('bank_ifsc',         ''),
  ('bank_upi_id',       ''),
  ('gpay_number',       '')
ON CONFLICT (key) DO NOTHING;
