import { supabase } from './supabase';

export type UserRole = 'admin' | 'manager' | 'analyst' | 'viewer';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface CaseStatus {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface Case {
  id: string;
  title: string;
  description: string;
  status_id: string;
  status?: CaseStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to: string | null;
  assigned_user?: AuthUser;
  created_by: string;
  created_user?: AuthUser;
  created_at: string;
  updated_at: string;
}

export interface CaseActivity {
  id: string;
  case_id: string;
  user_id: string;
  user?: AuthUser;
  action: string;
  description: string;
  timestamp: string;
}

export interface CaseComment {
  id: string;
  case_id: string;
  user_id: string;
  user?: AuthUser;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  role: UserRole;
  permission: string;
  description: string;
}

// Default role permissions
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'view_all_cases',
    'create_case',
    'edit_all_cases',
    'delete_case',
    'assign_case',
    'manage_users',
    'manage_roles',
    'view_reports',
  ],
  manager: [
    'view_all_cases',
    'create_case',
    'edit_assigned_cases',
    'assign_case',
    'view_team_cases',
    'view_reports',
  ],
  analyst: [
    'view_assigned_cases',
    'create_case',
    'edit_own_cases',
    'add_comments',
    'view_basic_reports',
  ],
  viewer: [
    'view_assigned_cases',
    'view_basic_reports',
    'add_comments',
  ],
};
