import { supabase } from './supabase';
import { AuthUser, Case, CaseComment, CaseActivity, CaseStatus, ROLE_PERMISSIONS, UserRole } from './types';

// ============== Authentication ==============

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return data as AuthUser | null;
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, displayName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) return { data: null, error };

  if (data.user) {
    const { error: insertError } = await supabase.from('users').insert({
      id: data.user.id,
      email: data.user.email,
      display_name: displayName,
      role: 'viewer',
    });

    if (insertError) return { data: null, error: insertError };
  }

  return { data, error: null };
}

export async function signOut() {
  return supabase.auth.signOut();
}

// ============== Users ==============

export async function getUser(userId: string) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  return data as AuthUser | null;
}

export async function updateUserRole(userId: string, role: UserRole) {
  return supabase.from('users').update({ role }).eq('id', userId);
}

export async function getAllUsers() {
  const { data } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  return (data as AuthUser[]) || [];
}

// ============== Cases ==============

export async function getCase(caseId: string) {
  const { data } = await supabase
    .from('cases')
    .select(`
      *,
      status:status_id (id, name, color, order),
      assigned_user:assigned_to (id, email, display_name),
      created_user:created_by (id, email, display_name)
    `)
    .eq('id', caseId)
    .single();

  return data as Case | null;
}

export async function getCases(filters?: {
  status_id?: string;
  assigned_to?: string;
  priority?: string;
  created_by?: string;
}) {
  let query = supabase
    .from('cases')
    .select(`
      *,
      status:status_id (id, name, color, order),
      assigned_user:assigned_to (id, email, display_name),
      created_user:created_by (id, email, display_name)
    `);

  if (filters?.status_id) {
    query = query.eq('status_id', filters.status_id);
  }

  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to);
  }

  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }

  if (filters?.created_by) {
    query = query.eq('created_by', filters.created_by);
  }

  const { data } = await query.order('created_at', { ascending: false });

  return (data as Case[]) || [];
}

export async function createCase(
  title: string,
  description: string,
  priority: 'low' | 'medium' | 'high' | 'critical',
  statusId: string,
  createdBy: string,
  assignedTo?: string
) {
  const { data, error } = await supabase
    .from('cases')
    .insert({
      title,
      description,
      priority,
      status_id: statusId,
      created_by: createdBy,
      assigned_to: assignedTo || null,
    })
    .select()
    .single();

  if (!error) {
    await logCaseActivity(
      data.id,
      createdBy,
      'created',
      `Case "${title}" was created`
    );
  }

  return { data, error };
}

export async function updateCase(
  caseId: string,
  updates: Partial<Case>,
  userId: string
) {
  const { data, error } = await supabase
    .from('cases')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', caseId)
    .select()
    .single();

  if (!error) {
    const changedFields = Object.keys(updates).join(', ');
    await logCaseActivity(
      caseId,
      userId,
      'updated',
      `Updated fields: ${changedFields}`
    );
  }

  return { data, error };
}

export async function deleteCase(caseId: string, userId: string) {
  const { error } = await supabase.from('cases').delete().eq('id', caseId);

  if (!error) {
    await logCaseActivity(
      caseId,
      userId,
      'deleted',
      'Case was deleted'
    );
  }

  return { error };
}

// ============== Case Status ==============

export async function getCaseStatuses() {
  const { data } = await supabase
    .from('case_statuses')
    .select('*')
    .order('order', { ascending: true });

  return (data as CaseStatus[]) || [];
}

export async function getDefaultStatus() {
  const { data } = await supabase
    .from('case_statuses')
    .select('*')
    .order('order', { ascending: true })
    .limit(1)
    .single();

  return data as CaseStatus | null;
}

// ============== Comments ==============

export async function getCaseComments(caseId: string) {
  const { data } = await supabase
    .from('case_comments')
    .select(`
      *,
      user:user_id (id, email, display_name)
    `)
    .eq('case_id', caseId)
    .order('created_at', { ascending: false });

  return (data as CaseComment[]) || [];
}

export async function addComment(
  caseId: string,
  userId: string,
  content: string
) {
  const { data, error } = await supabase
    .from('case_comments')
    .insert({
      case_id: caseId,
      user_id: userId,
      content,
    })
    .select()
    .single();

  if (!error) {
    await logCaseActivity(
      caseId,
      userId,
      'commented',
      'Added a comment'
    );
  }

  return { data, error };
}

// ============== Activity Log ==============

export async function getCaseActivity(caseId: string) {
  const { data } = await supabase
    .from('case_activity')
    .select(`
      *,
      user:user_id (id, email, display_name)
    `)
    .eq('case_id', caseId)
    .order('timestamp', { ascending: false });

  return (data as CaseActivity[]) || [];
}

export async function logCaseActivity(
  caseId: string,
  userId: string,
  action: string,
  description: string
) {
  return supabase.from('case_activity').insert({
    case_id: caseId,
    user_id: userId,
    action,
    description,
  });
}

// ============== Authorization ==============

export async function checkPermission(userRole: UserRole, permission: string): Promise<boolean> {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}

export async function canEditCase(case_: Case, userId: string, userRole: UserRole): Promise<boolean> {
  if (userRole === 'admin') return true;
  if (!checkPermission(userRole, 'edit_all_cases') && !checkPermission(userRole, 'edit_assigned_cases')) {
    return false;
  }

  // Managers can edit their assigned cases
  if (userRole === 'manager' && case_.assigned_to === userId) {
    return true;
  }

  // Analysts can edit their own cases
  if (userRole === 'analyst' && case_.created_by === userId) {
    return true;
  }

  return false;
}

export async function canDeleteCase(userId: string, userRole: UserRole): Promise<boolean> {
  return userRole === 'admin' && await checkPermission(userRole, 'delete_case');
}

export async function canAssignCase(userRole: UserRole): Promise<boolean> {
  return await checkPermission(userRole, 'assign_case');
}

export async function canViewAllCases(userRole: UserRole): Promise<boolean> {
  return await checkPermission(userRole, 'view_all_cases');
}
