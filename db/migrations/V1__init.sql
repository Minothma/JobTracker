-- V1__init.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE application_status AS ENUM (
  'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version_label VARCHAR(100) NOT NULL,
  s3_key VARCHAR(512) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  company_name VARCHAR(255) NOT NULL,
  role_title VARCHAR(255) NOT NULL,
  status application_status NOT NULL DEFAULT 'APPLIED',
  applied_date DATE NOT NULL,
  job_posting_url VARCHAR(1024),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  round_type VARCHAR(100) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  outcome VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_interviews_application_id ON interviews(application_id);
CREATE INDEX idx_notes_application_id ON notes(application_id);
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
