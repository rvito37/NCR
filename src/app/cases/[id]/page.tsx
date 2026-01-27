'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  getNCR,
  getNCRComments,
  getNCRTransitions,
  addNCRComment,
  executeWorkflowAction,
} from '@/lib/api';
import {
  NCR,
  NCRComment,
  WorkflowTransition,
  WorkflowAction,
  STAGE_INFO,
  getAvailableActions,
  getRoleLabel,
  WorkflowStage,
  ReworkResult,
} from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Textarea, Select } from '@/components/FormElements';

export default function NCRDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [ncr, setNCR] = useState<NCR | null>(null);
  const [comments, setComments] = useState<NCRComment[]>([]);
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionComment, setActionComment] = useState('');
  const [selectedAction, setSelectedAction] = useState<WorkflowAction | null>(null);
  const [reworkResult, setReworkResult] = useState<ReworkResult>('conformal');
  const [engineeringFindings, setEngineeringFindings] = useState('');
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const loadData = async () => {
      try {
        const [ncrData, ncrComments, ncrTransitions] = await Promise.all([
          getNCR(params.id),
          getNCRComments(params.id),
          getNCRTransitions(params.id),
        ]);

        if (!ncrData) {
          router.push('/cases');
          return;
        }

        setNCR(ncrData);
        setComments(ncrComments);
        setTransitions(ncrTransitions);
        setEngineeringFindings(ncrData.engineering_findings || '');
        setRootCauseAnalysis(ncrData.root_cause_analysis || '');
      } catch (error) {
        console.error('Failed to load NCR:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      loadData();
    }
  }, [params.id, isAuthenticated, isLoading, router]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const { data } = await addNCRComment(params.id, user.id, newComment);
      if (data) {
        setComments([{ ...data, user } as NCRComment, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWorkflowAction = async (action: WorkflowAction) => {
    if (!user || !ncr) return;

    setSubmitting(true);
    setActionError('');

    try {
      const result = await executeWorkflowAction(ncr, user, action, actionComment, {
        engineeringFindings: engineeringFindings || undefined,
        rootCauseAnalysis: rootCauseAnalysis || undefined,
        reworkResult: ncr.workflow_stage === 'rework' ? reworkResult : undefined,
      });

      if (result.success) {
        // Reload the NCR
        const updatedNCR = await getNCR(params.id);
        const updatedTransitions = await getNCRTransitions(params.id);
        setNCR(updatedNCR);
        setTransitions(updatedTransitions);
        setActionComment('');
        setSelectedAction(null);
      } else {
        setActionError(result.error || 'Action failed');
      }
    } catch (error) {
      setActionError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loading || !user) return null;
  if (!ncr) return null;

  const availableActions = getAvailableActions(user, ncr);
  const stageInfo = STAGE_INFO[ncr.workflow_stage as WorkflowStage] || {
    label: ncr.workflow_stage,
    color: '#6B7280',
  };

  const isPE = user.role === 'process_engineer' || user.role === 'admin';
  const isRework = ncr.workflow_stage === 'rework';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/cases" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          &larr; Back to NCRs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* NCR Header */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-500 font-mono">{ncr.ncr_number || 'Draft'}</p>
                  <h1 className="text-3xl font-bold text-gray-900">{ncr.title}</h1>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: stageInfo.color + '20',
                    color: stageInfo.color,
                  }}
                >
                  {stageInfo.label}
                </span>
              </div>
              <p className="text-gray-600 mb-6">{ncr.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <p
                    className={`font-semibold ${
                      ncr.priority === 'critical'
                        ? 'text-red-600'
                        : ncr.priority === 'high'
                        ? 'text-orange-600'
                        : ncr.priority === 'medium'
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}
                  >
                    {ncr.priority.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Batch Decision</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {ncr.batch_decision || 'Pending'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assigned Role</p>
                  <p className="font-semibold text-gray-900">
                    {ncr.assigned_role ? getRoleLabel(ncr.assigned_role) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(ncr.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Engineering Fields (for PE) */}
            {(isPE || ncr.engineering_findings || ncr.root_cause_analysis) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Engineering Analysis</h2>

                {isPE && ncr.workflow_stage === 'pe_review' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Engineering Findings
                      </label>
                      <Textarea
                        value={engineeringFindings}
                        onChange={(e) => setEngineeringFindings(e.target.value)}
                        placeholder="Enter your engineering findings..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Root Cause Analysis
                      </label>
                      <Textarea
                        value={rootCauseAnalysis}
                        onChange={(e) => setRootCauseAnalysis(e.target.value)}
                        placeholder="Enter root cause analysis..."
                        rows={4}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ncr.engineering_findings && (
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Engineering Findings</p>
                        <p className="mt-1 text-gray-900 whitespace-pre-wrap">{ncr.engineering_findings}</p>
                      </div>
                    )}
                    {ncr.root_cause_analysis && (
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Root Cause Analysis</p>
                        <p className="mt-1 text-gray-900 whitespace-pre-wrap">{ncr.root_cause_analysis}</p>
                      </div>
                    )}
                    {!ncr.engineering_findings && !ncr.root_cause_analysis && (
                      <p className="text-gray-500">No engineering analysis yet</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Rework Section */}
            {isRework && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-yellow-800 mb-4">Rework Required</h2>
                <p className="text-yellow-700 mb-4">
                  This NCR requires rework. After completing the rework, select the result and submit.
                </p>
                <Select
                  label="Rework Result"
                  value={reworkResult}
                  onChange={(e) => setReworkResult(e.target.value as ReworkResult)}
                  options={[
                    { value: 'conformal', label: 'Conformal' },
                    { value: 'partially_conformal', label: 'Partially Conformal' },
                    { value: 'non_conformal', label: 'Non Conformal' },
                  ]}
                />
              </div>
            )}

            {/* Workflow Actions */}
            {availableActions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-blue-900 mb-4">Available Actions</h2>

                {actionError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
                    {actionError}
                  </div>
                )}

                <div className="mb-4">
                  <Textarea
                    placeholder="Add a comment for this action (optional for some actions)..."
                    value={actionComment}
                    onChange={(e) => setActionComment(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableActions.map((actionRule) => (
                    <Button
                      key={actionRule.action}
                      variant={
                        ['approve', 'accept_batch', 'submit', 'submit_rework'].includes(actionRule.action)
                          ? 'primary'
                          : actionRule.action.includes('reject') || actionRule.action.includes('return')
                          ? 'danger'
                          : 'secondary'
                      }
                      size="sm"
                      onClick={() => handleWorkflowAction(actionRule.action)}
                      isLoading={submitting}
                      disabled={actionRule.requiresComment && !actionComment.trim()}
                    >
                      {actionRule.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Comments</h2>

              <form onSubmit={handleAddComment} className="mb-6">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  disabled={submitting}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="mt-2"
                  isLoading={submitting}
                  disabled={!newComment.trim()}
                >
                  Add Comment
                </Button>
              </form>

              <div className="space-y-4">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {comment.user?.display_name || comment.user?.email}
                        </p>
                        {comment.comment_type !== 'general' && (
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {comment.comment_type.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </p>
                      <p className="text-gray-700 mt-1">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No comments yet</p>
                )}
              </div>
            </div>

            {/* Workflow History */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Workflow History</h2>
              <div className="space-y-4">
                {transitions.length > 0 ? (
                  transitions.map((transition) => (
                    <div key={transition.id} className="border-l-4 border-gray-300 pl-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 capitalize">
                          {transition.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-gray-500">&rarr;</span>
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor:
                              (STAGE_INFO[transition.to_stage as WorkflowStage]?.color || '#6B7280') + '20',
                            color: STAGE_INFO[transition.to_stage as WorkflowStage]?.color || '#6B7280',
                          }}
                        >
                          {STAGE_INFO[transition.to_stage as WorkflowStage]?.label || transition.to_stage}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {transition.from_user?.display_name || transition.from_user?.email || 'System'} -{' '}
                        {new Date(transition.created_at).toLocaleString()}
                      </p>
                      {transition.comments && (
                        <p className="text-sm text-gray-600 mt-1">{transition.comments}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No workflow history yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">NCR Details</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium text-gray-900 capitalize">{ncr.final_status}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Current Stage</p>
                  <p
                    className="font-medium"
                    style={{ color: stageInfo.color }}
                  >
                    {stageInfo.label}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Assigned Role</p>
                  <p className="font-medium text-gray-900">
                    {ncr.assigned_role ? getRoleLabel(ncr.assigned_role) : 'Unassigned'}
                  </p>
                </div>

                <hr className="border-gray-200" />

                <div>
                  <p className="text-sm text-gray-500 mb-2">Approvals</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Process Engineer</span>
                      <span className={ncr.pe_approved ? 'text-green-600' : 'text-gray-400'}>
                        {ncr.pe_approved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Engineering Manager</span>
                      <span className={ncr.em_approved ? 'text-green-600' : 'text-gray-400'}>
                        {ncr.em_approved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Operations Manager</span>
                      <span className={ncr.om_approved ? 'text-green-600' : 'text-gray-400'}>
                        {ncr.om_approved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>QA Manager</span>
                      <span className={ncr.qa_approved ? 'text-green-600' : 'text-gray-400'}>
                        {ncr.qa_approved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-200" />

                <div>
                  <p className="text-sm text-gray-500">Created By</p>
                  <p className="font-medium text-gray-900">
                    {ncr.created_user?.display_name || ncr.created_user?.email}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="font-medium text-gray-900">
                    {new Date(ncr.created_at).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Updated At</p>
                  <p className="font-medium text-gray-900">
                    {new Date(ncr.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
