-- AI-LIMS Meta-Platform Database Schema
-- Multi-tenant, Cloud-ready Architecture

-- =============================================================================
-- ORGANIZATIONS (Multi-tenant core)
-- =============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,  -- subdomain/identifier
  description TEXT,
  settings JSONB DEFAULT '{}',
  -- Branding
  logo_url VARCHAR(500),
  primary_color VARCHAR(7) DEFAULT '#1976d2',
  -- Status
  status VARCHAR(50) DEFAULT 'active',  -- active, suspended, trial
  subscription_tier VARCHAR(50) DEFAULT 'free',  -- free, basic, pro, enterprise
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status);

-- =============================================================================
-- USERS (Extended for multi-tenant)
-- =============================================================================

CREATE TABLE IF NOT EXISTS platform_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url VARCHAR(500),
  -- Platform-level settings
  default_org_id UUID REFERENCES organizations(id),
  is_platform_admin BOOLEAN DEFAULT FALSE,
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  email_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_platform_users_email ON platform_users(email);

-- =============================================================================
-- ORGANIZATION MEMBERSHIPS (User-Org relationships)
-- =============================================================================

CREATE TABLE IF NOT EXISTS org_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'user',  -- owner, admin, manager, user, viewer
  permissions JSONB DEFAULT '{}',  -- Custom permissions
  -- Status
  status VARCHAR(50) DEFAULT 'active',  -- active, invited, suspended
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_org_memberships_org ON org_memberships(org_id);
CREATE INDEX idx_org_memberships_user ON org_memberships(user_id);

-- =============================================================================
-- MODULE DEFINITIONS (AI-generated, user-editable schemas)
-- =============================================================================

CREATE TABLE IF NOT EXISTS module_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Identity
  module_id VARCHAR(100) NOT NULL,  -- snake_case identifier
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'folder',
  color VARCHAR(7) DEFAULT '#1976d2',
  -- Configuration (THE CORE - full module specification)
  config JSONB NOT NULL DEFAULT '{}',
  /*
    config structure:
    {
      "fields": [...],
      "sections": [...],
      "list_view": {...},
      "workflows": [...],
      "permissions": {...},
      "integrations": {...}
    }
  */
  -- Versioning
  version INTEGER DEFAULT 1,
  published_version INTEGER DEFAULT 0,  -- 0 = never published
  -- Status
  status VARCHAR(50) DEFAULT 'draft',  -- draft, active, archived
  is_system BOOLEAN DEFAULT FALSE,  -- System modules can't be deleted
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES platform_users(id),
  updated_by UUID REFERENCES platform_users(id),
  -- Constraints
  UNIQUE(org_id, module_id)
);

CREATE INDEX idx_module_definitions_org ON module_definitions(org_id);
CREATE INDEX idx_module_definitions_status ON module_definitions(status);
CREATE INDEX idx_module_definitions_config ON module_definitions USING GIN(config);

-- =============================================================================
-- MODULE DEFINITION VERSIONS (History for rollback)
-- =============================================================================

CREATE TABLE IF NOT EXISTS module_definition_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_def_id UUID NOT NULL REFERENCES module_definitions(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  config JSONB NOT NULL,
  -- Change tracking
  change_summary TEXT,
  changed_by UUID REFERENCES platform_users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  -- Constraints
  UNIQUE(module_def_id, version)
);

CREATE INDEX idx_module_versions_def ON module_definition_versions(module_def_id);

-- =============================================================================
-- MODULE DATA (Dynamic data storage - THE MAIN DATA TABLE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS module_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  module_id VARCHAR(100) NOT NULL,  -- Links to module_definitions.module_id
  -- The actual data (flexible JSON storage)
  data JSONB NOT NULL DEFAULT '{}',
  /*
    data structure matches module's fields:
    {
      "barcode": "SMP-001",
      "sample_type": "blood",
      "status": "received",
      "custom_field": "value",
      ...
    }
  */
  -- Record status
  status VARCHAR(50) DEFAULT 'active',  -- active, deleted, archived
  -- Workflow state
  workflow_state JSONB DEFAULT '{}',
  /*
    workflow_state:
    {
      "current_step": "review",
      "history": [...],
      "approvals": {...}
    }
  */
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES platform_users(id),
  updated_by UUID REFERENCES platform_users(id)
);

-- Critical indexes for performance
CREATE INDEX idx_module_data_org_module ON module_data(org_id, module_id);
CREATE INDEX idx_module_data_status ON module_data(status);
CREATE INDEX idx_module_data_data ON module_data USING GIN(data);
CREATE INDEX idx_module_data_created ON module_data(created_at);

-- =============================================================================
-- AUDIT LOG (Immutable, comprehensive tracking)
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  -- What was affected
  entity_type VARCHAR(100) NOT NULL,  -- module_data, module_definition, user, etc.
  entity_id UUID NOT NULL,
  module_id VARCHAR(100),  -- For module_data records
  -- What happened
  action VARCHAR(50) NOT NULL,  -- create, update, delete, view, export, approve, reject
  -- Change details
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],  -- Array of field names that changed
  change_reason TEXT,
  -- Who did it
  user_id UUID NOT NULL,
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  -- When and where
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  -- E-signature (for 21 CFR Part 11)
  signature_meaning TEXT,  -- "I reviewed and approve these results"
  signature_hash VARCHAR(255)
);

-- Audit log should be fast to write and query by entity
CREATE INDEX idx_audit_log_org ON audit_log(org_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);

-- =============================================================================
-- RELATIONSHIPS (Links between module records)
-- =============================================================================

CREATE TABLE IF NOT EXISTS module_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Source record
  source_module_id VARCHAR(100) NOT NULL,
  source_record_id UUID NOT NULL,
  -- Target record
  target_module_id VARCHAR(100) NOT NULL,
  target_record_id UUID NOT NULL,
  -- Relationship type
  relationship_type VARCHAR(50) NOT NULL,  -- parent, child, reference, derived_from
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES platform_users(id)
);

CREATE INDEX idx_relationships_source ON module_relationships(org_id, source_module_id, source_record_id);
CREATE INDEX idx_relationships_target ON module_relationships(org_id, target_module_id, target_record_id);

-- =============================================================================
-- FILE ATTACHMENTS (Centralized file management)
-- =============================================================================

CREATE TABLE IF NOT EXISTS file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Link to record
  module_id VARCHAR(100),
  record_id UUID,
  field_id VARCHAR(100),
  -- File info
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  file_size BIGINT,
  -- Storage (abstracted for cloud migration)
  storage_provider VARCHAR(50) DEFAULT 'local',  -- local, s3, azure, gcs
  storage_path VARCHAR(500) NOT NULL,
  storage_bucket VARCHAR(255),
  -- Security
  checksum VARCHAR(64),  -- SHA-256
  encrypted BOOLEAN DEFAULT FALSE,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES platform_users(id)
);

CREATE INDEX idx_attachments_record ON file_attachments(org_id, module_id, record_id);

-- =============================================================================
-- DATA TRANSFERS (Between organizations)
-- =============================================================================

CREATE TABLE IF NOT EXISTS data_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Source
  source_org_id UUID NOT NULL REFERENCES organizations(id),
  -- Target
  target_org_id UUID NOT NULL REFERENCES organizations(id),
  -- What to transfer
  transfer_type VARCHAR(50) NOT NULL,  -- module_definition, module_data, full_clone
  module_id VARCHAR(100),  -- If specific module
  -- Options
  options JSONB DEFAULT '{}',
  /*
    options:
    {
      "include_data": true,
      "anonymize": false,
      "date_range": {...},
      "field_mapping": {...}
    }
  */
  -- Status
  status VARCHAR(50) DEFAULT 'pending',  -- pending, in_progress, completed, failed
  progress INTEGER DEFAULT 0,  -- 0-100
  records_transferred INTEGER DEFAULT 0,
  error_message TEXT,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES platform_users(id)
);

CREATE INDEX idx_transfers_source ON data_transfers(source_org_id);
CREATE INDEX idx_transfers_target ON data_transfers(target_org_id);

-- =============================================================================
-- TEMPLATES (Shareable module templates)
-- =============================================================================

CREATE TABLE IF NOT EXISTS module_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identity
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),  -- clinical, pharma, environmental, food, research
  tags TEXT[],
  -- Template content
  config JSONB NOT NULL,
  -- Visibility
  is_public BOOLEAN DEFAULT FALSE,  -- Available to all organizations
  created_by_org_id UUID REFERENCES organizations(id),
  -- Metadata
  use_count INTEGER DEFAULT 0,
  rating DECIMAL(2,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON module_templates(category);
CREATE INDEX idx_templates_public ON module_templates(is_public);

-- =============================================================================
-- SESSIONS (For stateless/Redis migration)
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id),  -- Current organization context
  -- Session data
  token_hash VARCHAR(255) NOT NULL,
  refresh_token_hash VARCHAR(255),
  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL,
  refresh_expires_at TIMESTAMPTZ,
  -- Device info
  ip_address INET,
  user_agent TEXT,
  device_id VARCHAR(255),
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- =============================================================================
-- SCHEDULED JOBS (For background processing)
-- =============================================================================

CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  -- Job definition
  job_type VARCHAR(100) NOT NULL,  -- report, export, notification, workflow
  job_data JSONB NOT NULL,
  -- Schedule
  schedule_type VARCHAR(50) NOT NULL,  -- once, daily, weekly, monthly, cron
  schedule_config JSONB,  -- cron expression or specific times
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  -- Status
  status VARCHAR(50) DEFAULT 'active',  -- active, paused, completed
  run_count INTEGER DEFAULT 0,
  last_result JSONB,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES platform_users(id)
);

CREATE INDEX idx_jobs_next_run ON scheduled_jobs(next_run_at) WHERE status = 'active';

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_platform_users_updated_at
  BEFORE UPDATE ON platform_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_module_definitions_updated_at
  BEFORE UPDATE ON module_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_module_data_updated_at
  BEFORE UPDATE ON module_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-increment version on module definition update
CREATE OR REPLACE FUNCTION increment_module_version()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.config IS DISTINCT FROM NEW.config THEN
    NEW.version = OLD.version + 1;
    -- Save to history
    INSERT INTO module_definition_versions (module_def_id, version, config, changed_by)
    VALUES (OLD.id, OLD.version, OLD.config, NEW.updated_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_module_def_version
  BEFORE UPDATE ON module_definitions
  FOR EACH ROW EXECUTE FUNCTION increment_module_version();
