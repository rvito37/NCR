import { supabase } from './supabase';
import {
  User,
  UserRole,
  NCR,
  NCRComment,
  WorkflowTransition,
  WorkflowStage,
  WorkflowAction,
  Priority,
  BatchDecision,
  ReworkResult,
  CommentType,
  WORKFLOW_TRANSITIONS,
  canUserActOnNCR,
} from './types';

// ============== Authentication ==============

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return data as User | null;
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, displayName: string) {
  // Триггер в Supabase автоматически создаёт профиль в public.users
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  return { data, error };
}

export async function signOut() {
  return supabase.auth.signOut();
}

// ============== Users ==============

export async function getUser(userId: string): Promise<User | null> {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  return data as User | null;
}

export async function updateUserRole(userId: string, role: UserRole) {
  return supabase.from('users').update({ role }).eq('id', userId);
}

export async function getAllUsers(): Promise<User[]> {
  const { data } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  return (data as User[]) || [];
}

export async function getUsersByRole(role: UserRole): Promise<User[]> {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('role', role)
    .eq('is_active', true);

  return (data as User[]) || [];
}

// ============== NCR ==============

export async function getNCR(ncrId: string): Promise<NCR | null> {
  const { data } = await supabase
    .from('ncr')
    .select(`
      *,
      assigned_user:assigned_to (id, email, display_name, role),
      created_user:created_by (id, email, display_name, role)
    `)
    .eq('id', ncrId)
    .single();

  return data as NCR | null;
}

export async function getNCRs(filters?: {
  workflow_stage?: WorkflowStage;
  assigned_to?: string;
  assigned_role?: UserRole;
  priority?: Priority;
  created_by?: string;
  final_status?: string;
  batch_decision?: BatchDecision;
}): Promise<NCR[]> {
  let query = supabase
    .from('ncr')
    .select(`
      *,
      assigned_user:assigned_to (id, email, display_name, role),
      created_user:created_by (id, email, display_name, role)
    `);

  if (filters?.workflow_stage) {
    query = query.eq('workflow_stage', filters.workflow_stage);
  }

  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to);
  }

  if (filters?.assigned_role) {
    query = query.eq('assigned_role', filters.assigned_role);
  }

  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }

  if (filters?.created_by) {
    query = query.eq('created_by', filters.created_by);
  }

  if (filters?.final_status) {
    query = query.eq('final_status', filters.final_status);
  }

  if (filters?.batch_decision) {
    query = query.eq('batch_decision', filters.batch_decision);
  }

  const { data } = await query.order('created_at', { ascending: false });

  return (data as NCR[]) || [];
}

export async function getMyNCRs(user: User): Promise<NCR[]> {
  // Get NCRs assigned to user or their role
  const { data } = await supabase
    .from('ncr')
    .select(`
      *,
      assigned_user:assigned_to (id, email, display_name, role),
      created_user:created_by (id, email, display_name, role)
    `)
    .or(`assigned_to.eq.${user.id},assigned_role.eq.${user.role},created_by.eq.${user.id}`)
    .order('created_at', { ascending: false });

  return (data as NCR[]) || [];
}

export async function createNCR(
  title: string,
  description: string,
  priority: Priority,
  createdBy: string
): Promise<{ data: NCR | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('ncr')
    .insert({
      title,
      description,
      priority,
      created_by: createdBy,
      workflow_stage: 'draft',
      assigned_role: 'station_supervisor',
      assigned_to: createdBy,
    })
    .select()
    .single();

  if (!error && data) {
    await createWorkflowTransition(
      data.id,
      null,
      'draft',
      null,
      null,
      'station_supervisor',
      'save_draft',
      null,
      'NCR created'
    );
  }

  return { data: data as NCR | null, error: error as Error | null };
}

export async function updateNCR(
  ncrId: string,
  updates: Partial<NCR>,
  userId: string
): Promise<{ data: NCR | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('ncr')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ncrId)
    .select()
    .single();

  return { data: data as NCR | null, error: error as Error | null };
}

export async function deleteNCR(ncrId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('ncr').delete().eq('id', ncrId);
  return { error: error as Error | null };
}

// ============== Workflow Actions ==============

export async function executeWorkflowAction(
  ncr: NCR,
  user: User,
  action: WorkflowAction,
  comments?: string,
  additionalData?: {
    batchDecision?: BatchDecision;
    engineeringFindings?: string;
    rootCauseAnalysis?: string;
    reworkResult?: ReworkResult;
    reworkNotes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  // Find the transition rule
  const transitions = WORKFLOW_TRANSITIONS[ncr.workflow_stage];
  const transitionRule = transitions?.find(t => t.action === action);

  if (!transitionRule) {
    return { success: false, error: 'Invalid action for current stage' };
  }

  // Check if user can perform this action
  if (!canUserActOnNCR(user, ncr)) {
    return { success: false, error: 'You do not have permission to perform this action' };
  }

  // Check if comment is required
  if (transitionRule.requiresComment && !comments) {
    return { success: false, error: 'Comment is required for this action' };
  }

  // Prepare update data
  const updateData: Partial<NCR> = {
    workflow_stage: transitionRule.nextStage,
    assigned_role: transitionRule.nextRole,
    assigned_to: null, // Will be assigned to role, not specific user
  };

  // Handle batch decision actions
  if (['accept_batch', 'partially_accept', 'reject_batch', 'request_rework'].includes(action)) {
    updateData.batch_decision = action === 'accept_batch' ? 'accept' :
      action === 'partially_accept' ? 'partially_accept' :
      action === 'reject_batch' ? 'reject' : 'rework';
  }

  // Handle approval flags
  if (action === 'approve') {
    switch (ncr.workflow_stage) {
      case 'pe_review':
        updateData.pe_approved = true;
        break;
      case 'em_review':
        updateData.em_approved = true;
        break;
      case 'pm_review':
        updateData.pm_approved = true;
        break;
      case 'om_review':
        updateData.om_approved = true;
        break;
      case 'qa_review':
        updateData.qa_approved = true;
        if (transitionRule.nextStage === 'approved') {
          updateData.final_status = 'approved';
        }
        break;
      case 'marketing_review':
        updateData.marketing_approved = true;
        break;
    }
  }

  // Handle additional data from Process Engineer
  if (additionalData?.engineeringFindings) {
    updateData.engineering_findings = additionalData.engineeringFindings;
  }
  if (additionalData?.rootCauseAnalysis) {
    updateData.root_cause_analysis = additionalData.rootCauseAnalysis;
  }
  if (additionalData?.reworkResult) {
    updateData.rework_result = additionalData.reworkResult;
  }
  if (additionalData?.reworkNotes) {
    updateData.rework_notes = additionalData.reworkNotes;
  }

  // Execute the update
  const { error } = await updateNCR(ncr.id, updateData, user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Log the transition
  await createWorkflowTransition(
    ncr.id,
    ncr.workflow_stage,
    transitionRule.nextStage,
    user.id,
    null,
    transitionRule.nextRole,
    action,
    additionalData?.batchDecision || null,
    comments || null
  );

  return { success: true };
}

// ============== Workflow Transitions ==============

export async function createWorkflowTransition(
  ncrId: string,
  fromStage: WorkflowStage | null,
  toStage: WorkflowStage,
  fromUserId: string | null,
  toUserId: string | null,
  toRole: UserRole | null,
  action: WorkflowAction | string,
  decision: string | null,
  comments: string | null
) {
  return supabase.from('workflow_transitions').insert({
    ncr_id: ncrId,
    from_stage: fromStage,
    to_stage: toStage,
    from_user_id: fromUserId,
    to_user_id: toUserId,
    to_role: toRole,
    action,
    decision,
    comments,
  });
}

export async function getNCRTransitions(ncrId: string): Promise<WorkflowTransition[]> {
  const { data } = await supabase
    .from('workflow_transitions')
    .select(`
      *,
      from_user:from_user_id (id, email, display_name, role),
      to_user:to_user_id (id, email, display_name, role)
    `)
    .eq('ncr_id', ncrId)
    .order('created_at', { ascending: false });

  return (data as WorkflowTransition[]) || [];
}

// ============== Comments ==============

export async function getNCRComments(ncrId: string): Promise<NCRComment[]> {
  const { data } = await supabase
    .from('ncr_comments')
    .select(`
      *,
      user:user_id (id, email, display_name, role)
    `)
    .eq('ncr_id', ncrId)
    .order('created_at', { ascending: false });

  return (data as NCRComment[]) || [];
}

export async function addNCRComment(
  ncrId: string,
  userId: string,
  content: string,
  commentType: CommentType = 'general'
): Promise<{ data: NCRComment | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('ncr_comments')
    .insert({
      ncr_id: ncrId,
      user_id: userId,
      content,
      comment_type: commentType,
    })
    .select()
    .single();

  return { data: data as NCRComment | null, error: error as Error | null };
}

// ============== Dashboard Stats ==============

export async function getDashboardStats(user: User): Promise<{
  total: number;
  myPending: number;
  approved: number;
  rejected: number;
  inRework: number;
  byStage: Record<WorkflowStage, number>;
}> {
  // Get all NCRs for stats
  const allNCRs = await getNCRs();
  const myNCRs = await getMyNCRs(user);

  const byStage: Record<string, number> = {};
  allNCRs.forEach(ncr => {
    byStage[ncr.workflow_stage] = (byStage[ncr.workflow_stage] || 0) + 1;
  });

  return {
    total: allNCRs.length,
    myPending: myNCRs.filter(n => n.final_status === 'in_progress').length,
    approved: allNCRs.filter(n => n.final_status === 'approved').length,
    rejected: allNCRs.filter(n => n.final_status === 'rejected').length,
    inRework: allNCRs.filter(n => n.workflow_stage === 'rework').length,
    byStage: byStage as Record<WorkflowStage, number>,
  };
}

// ============== Authorization Helpers ==============

export function canCreateNCR(userRole: UserRole): boolean {
  return ['station_supervisor', 'admin'].includes(userRole);
}

export function canDeleteNCR(userRole: UserRole): boolean {
  return userRole === 'admin';
}

export function canViewAllNCRs(userRole: UserRole): boolean {
  return ['admin', 'qa_manager', 'operations_manager', 'production_control'].includes(userRole);
}
