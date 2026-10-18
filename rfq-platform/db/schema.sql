-- SpecBridge application tables. Run AFTER Better Auth migrations.
-- Persistent data must be stored in PostgreSQL, never in a GitHub repository.
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin','engineer','vendor')),
  company_id UUID REFERENCES companies(id),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((role='vendor' AND company_id IS NOT NULL) OR (role<>'vendor' AND company_id IS NULL))
);
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  owner_id TEXT NOT NULL REFERENCES "user"(id),
  deadline_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS projects_owner_idx ON projects(owner_id, created_at DESC);
CREATE TABLE IF NOT EXISTS project_invitations (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invited_by TEXT NOT NULL REFERENCES "user"(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, company_id)
);
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  filename TEXT NOT NULL,
  pathname TEXT NOT NULL UNIQUE,
  size_bytes INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id,version)
);
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount NUMERIC(16,2) NOT NULL CHECK(amount>=0),
  lead_days INTEGER NOT NULL CHECK(lead_days>0),
  included TEXT NOT NULL DEFAULT '',
  excluded TEXT NOT NULL DEFAULT '',
  technical_notes TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT 'submitted' CHECK(state IN ('draft','submitted')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id,company_id),
  FOREIGN KEY (project_id,company_id) REFERENCES project_invitations(project_id,company_id)
);
CREATE TABLE IF NOT EXISTS offer_history (
  id BIGSERIAL PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  changed_by TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  company_id UUID NOT NULL,
  sender_id TEXT NOT NULL REFERENCES "user"(id),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (project_id,company_id) REFERENCES project_invitations(project_id,company_id)
);
CREATE INDEX IF NOT EXISTS messages_thread_idx ON messages(project_id,company_id,created_at);
CREATE TABLE IF NOT EXISTS audit_records (
  id BIGSERIAL PRIMARY KEY,
  actor_id TEXT REFERENCES "user"(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_records_created_idx ON audit_records(created_at DESC);
