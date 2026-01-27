// ============== NCR Jerusalem System Types ==============

// User Roles based on NCR workflow
export type UserRole =
  | 'station_supervisor'
  | 'process_engineer'
  | 'engineering_manager'
  | 'product_manager'
  | 'operations_manager'
  | 'qa_manager'
  | 'marketing_manager'
  | 'production_control'
  | 'admin';

// Workflow stages
export type WorkflowStage =
  | 'draft'
  | 'submitted'
  | 'pe_review'
  | 'em_review'
  | 'pm_review'
  | 'om_review'
  | 'qa_review'
  | 'marketing_review'
  | 'rework'
  | 'approved'
  | 'rejected';

// Batch decisions
export type BatchDecision = 'pending' | 'accept' | 'partially_accept' | 'reject' | 'rework';

// Rework results
export type ReworkResult = 'conformal' | 'partially_conformal' | 'non_conformal';

// Final status
export type FinalStatus = 'in_progress' | 'approved' | 'rejected' | 'closed';

// Priority levels
export type Priority = 'low' | 'medium' | 'high' | 'critical';

// Comment types
export type CommentType = 'general' | 'engineering_finding' | 'root_cause' | 'approval_note' | 'rejection_reason' | 'info_request';

// Workflow actions
export type WorkflowAction =
  | 'save_draft'
  | 'submit'
  | 'accept_batch'
  | 'partially_accept'
  | 'reject_batch'
  | 'request_rework'
  | 'approve'
  | 'return'
  | 'request_info'
  | 'move_to_pm'
  | 'request_marketing'
  | 'submit_rework'
  | 'change_decision';

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStageInfo {
  id: string;
  code: WorkflowStage;
  name: string;
  description: string | null;
  color: string;
  order: number;
}

export interface NCR {
  id: string;
  ncr_number: string | null;
  title: string;
  description: string | null;

  // Workflow
  workflow_stage: WorkflowStage;
  assigned_to: string | null;
  assigned_role: UserRole | null;
  assigned_user?: User;

  // Batch decision
  batch_decision: BatchDecision;

  // Process Engineer fields
  engineering_findings: string | null;
  root_cause_analysis: string | null;

  // Rework fields
  rework_result: ReworkResult | null;
  rework_notes: string | null;

  // Approvals
  pe_approved: boolean;
  em_approved: boolean;
  pm_approved: boolean;
  om_approved: boolean;
  qa_approved: boolean;
  marketing_approved: boolean;

  // Final status
  final_status: FinalStatus;

  // Metadata
  priority: Priority;
  created_by: string;
  created_user?: User;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTransition {
  id: string;
  ncr_id: string;
  from_stage: WorkflowStage | null;
  to_stage: WorkflowStage;
  from_user_id: string | null;
  from_user?: User;
  to_user_id: string | null;
  to_user?: User;
  to_role: UserRole | null;
  action: WorkflowAction;
  decision: string | null;
  comments: string | null;
  created_at: string;
}

export interface NCRComment {
  id: string;
  ncr_id: string;
  user_id: string;
  user?: User;
  content: string;
  comment_type: CommentType;
  created_at: string;
  updated_at: string;
}

export interface NCRAttachment {
  id: string;
  ncr_id: string;
  user_id: string;
  user?: User;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

// ============== Role Permissions ==============

export interface RoleConfig {
  label: string;
  description: string;
  allowedStages: WorkflowStage[];
  allowedActions: WorkflowAction[];
}

export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  station_supervisor: {
    label: 'Station Supervisor',
    description: 'Creates and submits NCRs',
    allowedStages: ['draft', 'rework'],
    allowedActions: ['save_draft', 'submit', 'submit_rework'],
  },
  process_engineer: {
    label: 'Process Engineer',
    description: 'Reviews NCRs, adds findings, makes batch decisions',
    allowedStages: ['pe_review'],
    allowedActions: [
      'accept_batch',
      'partially_accept',
      'reject_batch',
      'request_rework',
      'request_info',
      'move_to_pm',
    ],
  },
  engineering_manager: {
    label: 'Engineering Manager',
    description: 'Approves PE decisions, can change decisions',
    allowedStages: ['em_review'],
    allowedActions: ['approve', 'return', 'request_info', 'change_decision'],
  },
  product_manager: {
    label: 'Product Manager',
    description: 'Reviews NCRs, can make batch decisions if PE hasn\'t',
    allowedStages: ['pm_review'],
    allowedActions: [
      'approve',
      'return',
      'request_info',
      'accept_batch',
      'partially_accept',
      'reject_batch',
      'request_rework',
    ],
  },
  operations_manager: {
    label: 'Operations Manager',
    description: 'Approves EM decisions',
    allowedStages: ['om_review'],
    allowedActions: ['approve', 'return', 'request_info'],
  },
  qa_manager: {
    label: 'QA Manager',
    description: 'Final approval, can request Marketing review',
    allowedStages: ['qa_review'],
    allowedActions: ['approve', 'return', 'request_info', 'request_marketing'],
  },
  marketing_manager: {
    label: 'Marketing Manager',
    description: 'Reviews when requested by QA',
    allowedStages: ['marketing_review'],
    allowedActions: ['approve', 'return', 'request_info'],
  },
  production_control: {
    label: 'Production Control',
    description: 'Receives notifications, monitors workflow',
    allowedStages: [],
    allowedActions: [],
  },
  admin: {
    label: 'Administrator',
    description: 'Full system access',
    allowedStages: ['draft', 'submitted', 'pe_review', 'em_review', 'pm_review', 'om_review', 'qa_review', 'marketing_review', 'rework', 'approved', 'rejected'],
    allowedActions: [
      'save_draft', 'submit', 'accept_batch', 'partially_accept', 'reject_batch',
      'request_rework', 'approve', 'return', 'request_info', 'move_to_pm',
      'request_marketing', 'submit_rework', 'change_decision',
    ],
  },
};

// ============== Workflow Transitions Map ==============

export interface WorkflowTransitionRule {
  action: WorkflowAction;
  label: string;
  nextStage: WorkflowStage;
  nextRole: UserRole;
  requiresComment?: boolean;
  requiresDecision?: boolean;
}

export const WORKFLOW_TRANSITIONS: Record<WorkflowStage, WorkflowTransitionRule[]> = {
  draft: [
    { action: 'submit', label: 'Submit NCR', nextStage: 'submitted', nextRole: 'production_control' },
  ],
  submitted: [
    { action: 'approve', label: 'Send to Process Engineer', nextStage: 'pe_review', nextRole: 'process_engineer' },
  ],
  pe_review: [
    { action: 'accept_batch', label: 'Accept Batch', nextStage: 'em_review', nextRole: 'engineering_manager', requiresDecision: true },
    { action: 'partially_accept', label: 'Partially Accept', nextStage: 'em_review', nextRole: 'engineering_manager', requiresDecision: true },
    { action: 'reject_batch', label: 'Reject Batch', nextStage: 'em_review', nextRole: 'engineering_manager', requiresDecision: true },
    { action: 'request_rework', label: 'Request Rework', nextStage: 'rework', nextRole: 'station_supervisor', requiresComment: true },
    { action: 'move_to_pm', label: 'Move to Product Manager', nextStage: 'pm_review', nextRole: 'product_manager' },
    { action: 'request_info', label: 'Request Additional Info', nextStage: 'pe_review', nextRole: 'process_engineer', requiresComment: true },
  ],
  em_review: [
    { action: 'approve', label: 'Approve', nextStage: 'om_review', nextRole: 'operations_manager' },
    { action: 'return', label: 'Return to Process Engineer', nextStage: 'pe_review', nextRole: 'process_engineer', requiresComment: true },
    { action: 'change_decision', label: 'Change Decision', nextStage: 'em_review', nextRole: 'engineering_manager', requiresDecision: true },
    { action: 'request_info', label: 'Request Additional Info', nextStage: 'em_review', nextRole: 'engineering_manager', requiresComment: true },
  ],
  pm_review: [
    { action: 'approve', label: 'Approve', nextStage: 'em_review', nextRole: 'engineering_manager' },
    { action: 'return', label: 'Return to Process Engineer', nextStage: 'pe_review', nextRole: 'process_engineer', requiresComment: true },
    { action: 'accept_batch', label: 'Accept Batch', nextStage: 'em_review', nextRole: 'engineering_manager', requiresDecision: true },
    { action: 'partially_accept', label: 'Partially Accept', nextStage: 'em_review', nextRole: 'engineering_manager', requiresDecision: true },
    { action: 'reject_batch', label: 'Reject Batch', nextStage: 'em_review', nextRole: 'engineering_manager', requiresDecision: true },
    { action: 'request_rework', label: 'Request Rework', nextStage: 'rework', nextRole: 'station_supervisor', requiresComment: true },
    { action: 'request_info', label: 'Request Additional Info', nextStage: 'pm_review', nextRole: 'product_manager', requiresComment: true },
  ],
  om_review: [
    { action: 'approve', label: 'Approve', nextStage: 'qa_review', nextRole: 'qa_manager' },
    { action: 'return', label: 'Return to Engineering Manager', nextStage: 'em_review', nextRole: 'engineering_manager', requiresComment: true },
    { action: 'request_info', label: 'Request Additional Info', nextStage: 'om_review', nextRole: 'operations_manager', requiresComment: true },
  ],
  qa_review: [
    { action: 'approve', label: 'Final Approve', nextStage: 'approved', nextRole: 'production_control' },
    { action: 'return', label: 'Return to Engineering Manager', nextStage: 'em_review', nextRole: 'engineering_manager', requiresComment: true },
    { action: 'request_marketing', label: 'Request Marketing Approval', nextStage: 'marketing_review', nextRole: 'marketing_manager' },
    { action: 'request_info', label: 'Request Additional Info', nextStage: 'qa_review', nextRole: 'qa_manager', requiresComment: true },
  ],
  marketing_review: [
    { action: 'approve', label: 'Approve', nextStage: 'qa_review', nextRole: 'qa_manager' },
    { action: 'return', label: 'Return to QA Manager', nextStage: 'qa_review', nextRole: 'qa_manager', requiresComment: true },
    { action: 'request_info', label: 'Request Additional Info', nextStage: 'marketing_review', nextRole: 'marketing_manager', requiresComment: true },
  ],
  rework: [
    { action: 'submit_rework', label: 'Submit After Rework', nextStage: 'pe_review', nextRole: 'process_engineer' },
  ],
  approved: [],
  rejected: [],
};

// ============== Stage Display Info ==============

export const STAGE_INFO: Record<WorkflowStage, { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#6B7280' },
  submitted: { label: 'Submitted', color: '#3B82F6' },
  pe_review: { label: 'Process Engineer Review', color: '#F59E0B' },
  em_review: { label: 'Engineering Manager Review', color: '#8B5CF6' },
  pm_review: { label: 'Product Manager Review', color: '#EC4899' },
  om_review: { label: 'Operations Manager Review', color: '#14B8A6' },
  qa_review: { label: 'QA Manager Review', color: '#F97316' },
  marketing_review: { label: 'Marketing Review', color: '#84CC16' },
  rework: { label: 'Rework Required', color: '#EF4444' },
  approved: { label: 'Approved', color: '#10B981' },
  rejected: { label: 'Rejected', color: '#DC2626' },
};

// ============== Helper Functions ==============

export function canUserActOnNCR(user: User, ncr: NCR): boolean {
  if (user.role === 'admin') return true;
  if (ncr.assigned_to === user.id) return true;
  if (ncr.assigned_role === user.role) return true;
  return false;
}

export function getAvailableActions(user: User, ncr: NCR): WorkflowTransitionRule[] {
  if (!canUserActOnNCR(user, ncr)) return [];

  const stageTransitions = WORKFLOW_TRANSITIONS[ncr.workflow_stage] || [];
  const roleConfig = ROLE_CONFIG[user.role];

  if (user.role === 'admin') return stageTransitions;

  return stageTransitions.filter(t => roleConfig.allowedActions.includes(t.action));
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_CONFIG[role]?.label || role;
}

export function getStageLabel(stage: WorkflowStage): string {
  return STAGE_INFO[stage]?.label || stage;
}

export function getStageColor(stage: WorkflowStage): string {
  return STAGE_INFO[stage]?.color || '#6B7280';
}
