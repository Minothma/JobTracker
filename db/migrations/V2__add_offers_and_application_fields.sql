-- =============================================================================
-- Migration: V2__add_offers_and_application_fields.sql
-- Description: Adds offers table and expands applications table fields
-- =============================================================================

-- 1. Add new columns to applications table
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS salary_min NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS salary_max NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS work_mode VARCHAR(20) DEFAULT 'REMOTE',
  ADD COLUMN IF NOT EXISTS location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS job_description TEXT,
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Create index on (user_id, is_favorite) for fast favorite filtering
CREATE INDEX IF NOT EXISTS idx_applications_user_favorite ON applications(user_id, is_favorite);

-- 3. Create offers table for compensation package tracking
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID UNIQUE NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  base_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  bonus NUMERIC(12,2) NOT NULL DEFAULT 0,
  equity NUMERIC(12,2) NOT NULL DEFAULT 0,
  work_mode VARCHAR(20) NOT NULL DEFAULT 'REMOTE',
  benefits_summary TEXT,
  offer_deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create indexes for offers table
CREATE INDEX IF NOT EXISTS idx_offers_user_id ON offers(user_id);
CREATE INDEX IF NOT EXISTS idx_offers_application_id ON offers(application_id);
