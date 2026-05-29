-- FormForge Database Schema
-- Auto-applied on backend startup

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────
-- USERS  (dashboard accounts)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- FORMS  (each form = one public endpoint)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  -- endpoint_token is the public identifier used in /f/:token
  -- generated as 32 random bytes → 64-char hex string
  endpoint_token   VARCHAR(64) UNIQUE NOT NULL,
  is_active        BOOLEAN DEFAULT true,
  -- CORS: array of allowed origins, e.g. {"https://mysite.com"}
  -- NULL or empty = allow all origins
  allowed_origins  TEXT[],
  -- Where to redirect browser after an HTML form submission
  redirect_url     TEXT,
  -- Notification settings
  notify_email     VARCHAR(255),
  notify_webhook   TEXT,
  -- Spam protection toggle
  spam_protection  BOOLEAN DEFAULT true,
  -- Running total (not used for enforcement, just display)
  submission_count INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- SUBMISSIONS
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id      UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  -- All submitted fields stored as JSONB (flexible schema)
  data         JSONB NOT NULL,
  -- Meta
  submitter_ip VARCHAR(45),
  referrer     TEXT,
  origin       TEXT,
  is_spam      BOOLEAN DEFAULT false,
  is_read      BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_forms_user_id          ON forms(user_id);
CREATE INDEX IF NOT EXISTS idx_forms_endpoint_token   ON forms(endpoint_token);
CREATE INDEX IF NOT EXISTS idx_submissions_form_id    ON submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_is_spam    ON submissions(form_id, is_spam);
CREATE INDEX IF NOT EXISTS idx_submissions_is_read    ON submissions(form_id, is_read);
-- GIN index for JSONB field search
CREATE INDEX IF NOT EXISTS idx_submissions_data       ON submissions USING GIN (data);
