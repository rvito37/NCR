-- ============== Users Table ==============
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'analyst', 'viewer')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============== Case Statuses Table ==============
CREATE TABLE IF NOT EXISTS case_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  "order" INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============== Cases Table ==============
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status_id UUID NOT NULL REFERENCES case_statuses(id),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============== Case Comments Table ==============
CREATE TABLE IF NOT EXISTS case_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============== Case Activity Log Table ==============
CREATE TABLE IF NOT EXISTS case_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============== Indexes ==============
CREATE INDEX IF NOT EXISTS idx_cases_status_id ON cases(status_id);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cases_created_by ON cases(created_by);
CREATE INDEX IF NOT EXISTS idx_case_comments_case_id ON case_comments(case_id);
CREATE INDEX IF NOT EXISTS idx_case_comments_user_id ON case_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_case_activity_case_id ON case_activity(case_id);
CREATE INDEX IF NOT EXISTS idx_case_activity_user_id ON case_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============== Default Case Statuses ==============
INSERT INTO case_statuses (name, description, color, "order", is_default)
VALUES
  ('Open', 'New case, not yet assigned', '#3B82F6', 1, true),
  ('In Progress', 'Case is currently being worked on', '#F59E0B', 2, false),
  ('On Hold', 'Case is temporarily suspended', '#8B5CF6', 3, false),
  ('Resolved', 'Case has been resolved', '#10B981', 4, false),
  ('Closed', 'Case has been closed', '#6B7280', 5, false)
ON CONFLICT DO NOTHING;

-- ============== Row Level Security Policies ==============

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_activity ENABLE ROW LEVEL SECURITY;

-- Users can view all users
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

-- Users can view their own profile
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admin can manage users
CREATE POLICY "Admins can manage users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Anyone can create cases
CREATE POLICY "Users can create cases" ON cases
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can view cases
CREATE POLICY "Users can view cases" ON cases
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- User created the case
      created_by = auth.uid() OR
      -- User is assigned to the case
      assigned_to = auth.uid() OR
      -- User is admin or manager (can view all)
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
      )
    )
  );

-- Users can update cases they created or are assigned to, or admins can update any
CREATE POLICY "Users can update cases" ON cases
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid() OR
      assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
      )
    )
  );

-- Only admins can delete cases
CREATE POLICY "Admins can delete cases" ON cases
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view comments on their cases
CREATE POLICY "Users can view comments" ON case_comments
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM cases c 
        WHERE c.id = case_id AND (
          c.created_by = auth.uid() OR 
          c.assigned_to = auth.uid() OR
          EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
          )
        )
      )
    )
  );

-- Users can add comments
CREATE POLICY "Users can add comments" ON case_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view activity logs
CREATE POLICY "Users can view activity" ON case_activity
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM cases c 
        WHERE c.id = case_id AND (
          c.created_by = auth.uid() OR 
          c.assigned_to = auth.uid() OR
          EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
          )
        )
      )
    )
  );
