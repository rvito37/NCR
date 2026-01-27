-- ============== NCR Jerusalem System Schema ==============
-- Non-Conformance Report Workflow System

-- ============== Users Table ==============
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'station_supervisor' CHECK (role IN (
    'station_supervisor',
    'process_engineer',
    'engineering_manager',
    'product_manager',
    'operations_manager',
    'qa_manager',
    'marketing_manager',
    'production_control',
    'admin'
  )),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============== NCR Workflow Stages ==============
CREATE TABLE IF NOT EXISTS workflow_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============== NCR Table (formerly cases) ==============
CREATE TABLE IF NOT EXISTS ncr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ncr_number VARCHAR(50) UNIQUE, -- Auto-generated NCR number
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Workflow fields
  workflow_stage VARCHAR(50) NOT NULL DEFAULT 'draft',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_role VARCHAR(50), -- Which role currently owns this NCR

  -- Batch decision (by Process Engineer or Product Manager)
  batch_decision VARCHAR(50) CHECK (batch_decision IN (
    'pending', 'accept', 'partially_accept', 'reject', 'rework'
  )) DEFAULT 'pending',

  -- Process Engineer fields
  engineering_findings TEXT,
  root_cause_analysis TEXT,

  -- Rework fields
  rework_result VARCHAR(50) CHECK (rework_result IN (
    'conformal', 'partially_conformal', 'non_conformal'
  )),
  rework_notes TEXT,

  -- Approval tracking
  pe_approved BOOLEAN DEFAULT false,
  em_approved BOOLEAN DEFAULT false,
  pm_approved BOOLEAN DEFAULT false,
  om_approved BOOLEAN DEFAULT false,
  qa_approved BOOLEAN DEFAULT false,
  marketing_approved BOOLEAN DEFAULT false,

  -- Final status
  final_status VARCHAR(50) CHECK (final_status IN (
    'in_progress', 'approved', 'rejected', 'closed'
  )) DEFAULT 'in_progress',

  -- Metadata
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============== Workflow Transitions (History) ==============
CREATE TABLE IF NOT EXISTS workflow_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ncr_id UUID NOT NULL REFERENCES ncr(id) ON DELETE CASCADE,

  from_stage VARCHAR(50),
  to_stage VARCHAR(50) NOT NULL,

  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  to_role VARCHAR(50), -- Target role if no specific user

  action VARCHAR(100) NOT NULL, -- e.g., 'submit', 'approve', 'reject', 'return', 'request_info'
  decision VARCHAR(50), -- e.g., 'accept', 'reject', 'rework'
  comments TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============== NCR Comments Table ==============
CREATE TABLE IF NOT EXISTS ncr_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ncr_id UUID NOT NULL REFERENCES ncr(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  comment_type VARCHAR(50) DEFAULT 'general' CHECK (comment_type IN (
    'general', 'engineering_finding', 'root_cause', 'approval_note', 'rejection_reason', 'info_request'
  )),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============== NCR Attachments Table ==============
CREATE TABLE IF NOT EXISTS ncr_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ncr_id UUID NOT NULL REFERENCES ncr(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============== Indexes ==============
CREATE INDEX IF NOT EXISTS idx_ncr_workflow_stage ON ncr(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_ncr_assigned_to ON ncr(assigned_to);
CREATE INDEX IF NOT EXISTS idx_ncr_assigned_role ON ncr(assigned_role);
CREATE INDEX IF NOT EXISTS idx_ncr_created_by ON ncr(created_by);
CREATE INDEX IF NOT EXISTS idx_ncr_final_status ON ncr(final_status);
CREATE INDEX IF NOT EXISTS idx_ncr_batch_decision ON ncr(batch_decision);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_ncr_id ON workflow_transitions(ncr_id);
CREATE INDEX IF NOT EXISTS idx_ncr_comments_ncr_id ON ncr_comments(ncr_id);
CREATE INDEX IF NOT EXISTS idx_ncr_attachments_ncr_id ON ncr_attachments(ncr_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============== Default Workflow Stages ==============
INSERT INTO workflow_stages (code, name, description, color, "order")
VALUES
  ('draft', 'Draft', 'NCR created but not submitted', '#6B7280', 1),
  ('submitted', 'Submitted', 'Submitted to Production Control', '#3B82F6', 2),
  ('pe_review', 'Process Engineer Review', 'Under review by Process Engineer', '#F59E0B', 3),
  ('em_review', 'Engineering Manager Review', 'Awaiting Engineering Manager approval', '#8B5CF6', 4),
  ('pm_review', 'Product Manager Review', 'Under review by Product Manager', '#EC4899', 5),
  ('om_review', 'Operations Manager Review', 'Awaiting Operations Manager approval', '#14B8A6', 6),
  ('qa_review', 'QA Manager Review', 'Awaiting QA Manager approval', '#F97316', 7),
  ('marketing_review', 'Marketing Manager Review', 'Awaiting Marketing Manager approval', '#84CC16', 8),
  ('rework', 'Rework Required', 'Batch sent for rework', '#EF4444', 9),
  ('approved', 'Approved', 'NCR fully approved', '#10B981', 10),
  ('rejected', 'Rejected', 'NCR rejected', '#DC2626', 11)
ON CONFLICT (code) DO NOTHING;

-- ============== Row Level Security Policies ==============

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncr ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncr_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncr_attachments ENABLE ROW LEVEL SECURITY;

-- Users can view all users
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admin can manage users
CREATE POLICY "Admins can manage users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- NCR Policies
-- Station Supervisors can create NCRs
CREATE POLICY "Station supervisors can create NCR" ON ncr
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('station_supervisor', 'admin')
    )
  );

-- Users can view NCRs based on their role
CREATE POLICY "Users can view NCR" ON ncr
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- User created the NCR
      created_by = auth.uid() OR
      -- User is assigned to the NCR
      assigned_to = auth.uid() OR
      -- User's role matches assigned_role
      EXISTS (
        SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = assigned_role
      ) OR
      -- Admin, QA Manager, Operations Manager can see all
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role IN ('admin', 'qa_manager', 'operations_manager', 'production_control')
      )
    )
  );

-- Users can update NCRs they are assigned to or own
CREATE POLICY "Users can update NCR" ON ncr
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = assigned_role
      ) OR
      EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Only admins can delete NCRs
CREATE POLICY "Admins can delete NCR" ON ncr
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Workflow transitions - anyone can view for NCRs they can see
CREATE POLICY "Users can view transitions" ON workflow_transitions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM ncr n WHERE n.id = ncr_id AND (
        n.created_by = auth.uid() OR
        n.assigned_to = auth.uid() OR
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = n.assigned_role) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'qa_manager', 'operations_manager', 'production_control'))
      )
    )
  );

-- Users can create transitions (when taking action)
CREATE POLICY "Users can create transitions" ON workflow_transitions
  FOR INSERT WITH CHECK (auth.uid() = from_user_id OR from_user_id IS NULL);

-- Comments - viewable by those who can see the NCR
CREATE POLICY "Users can view comments" ON ncr_comments
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM ncr n WHERE n.id = ncr_id AND (
        n.created_by = auth.uid() OR
        n.assigned_to = auth.uid() OR
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = n.assigned_role) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'qa_manager', 'operations_manager', 'production_control'))
      )
    )
  );

-- Users can add comments
CREATE POLICY "Users can add comments" ON ncr_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Attachments policies (same as comments)
CREATE POLICY "Users can view attachments" ON ncr_attachments
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM ncr n WHERE n.id = ncr_id AND (
        n.created_by = auth.uid() OR
        n.assigned_to = auth.uid() OR
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = n.assigned_role) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'qa_manager', 'operations_manager', 'production_control'))
      )
    )
  );

CREATE POLICY "Users can add attachments" ON ncr_attachments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============== Function to generate NCR number ==============
CREATE OR REPLACE FUNCTION generate_ncr_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ncr_number := 'NCR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('ncr_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for NCR numbers
CREATE SEQUENCE IF NOT EXISTS ncr_number_seq START 1;

-- Trigger to auto-generate NCR number
DROP TRIGGER IF EXISTS set_ncr_number ON ncr;
CREATE TRIGGER set_ncr_number
  BEFORE INSERT ON ncr
  FOR EACH ROW
  WHEN (NEW.ncr_number IS NULL)
  EXECUTE FUNCTION generate_ncr_number();

-- ============== Function to update updated_at ==============
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_ncr_updated_at ON ncr;
CREATE TRIGGER update_ncr_updated_at
  BEFORE UPDATE ON ncr
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
