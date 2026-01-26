'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCaseStore } from '@/lib/store';
import {
  getCase,
  getCaseComments,
  getCaseActivity,
  addComment,
  updateCase,
  canEditCase,
  getCaseStatuses,
  getAllUsers,
} from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Textarea } from '@/components/FormElements';

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { cases } = useCaseStore();
  const [caseData, setCaseData] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const loadData = async () => {
      try {
        const [caseItem, caseComments, caseActivity, caseStatuses, allUsers] =
          await Promise.all([
            getCase(params.id),
            getCaseComments(params.id),
            getCaseActivity(params.id),
            getCaseStatuses(),
            getAllUsers(),
          ]);

        if (!caseItem) {
          router.push('/cases');
          return;
        }

        setCaseData(caseItem);
        setComments(caseComments);
        setActivity(caseActivity);
        setStatuses(caseStatuses);
        setUsers(allUsers);

        if (user) {
          const userCanEdit = await canEditCase(caseItem, user.id, user.role);
          setCanEdit(userCanEdit);
        }
      } catch (error) {
        console.error('Failed to load case:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      loadData();
    }
  }, [params.id, isAuthenticated, isLoading, router, user]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const { data } = await addComment(params.id, user.id, newComment);
      if (data) {
        setComments([{ ...data, user }, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatusId: string) => {
    if (!user) return;

    try {
      await updateCase(params.id, { status_id: newStatusId }, user.id);
      setCaseData({
        ...caseData,
        status_id: newStatusId,
        status: statuses.find((s) => s.id === newStatusId),
      });
    } catch (error) {
      console.error('Failed to update case:', error);
    }
  };

  const handleAssignChange = async (newAssignedTo: string | null) => {
    if (!user) return;

    try {
      await updateCase(params.id, { assigned_to: newAssignedTo }, user.id);
      setCaseData({
        ...caseData,
        assigned_to: newAssignedTo,
        assigned_user: users.find((u) => u.id === newAssignedTo) || null,
      });
    } catch (error) {
      console.error('Failed to update case:', error);
    }
  };

  if (isLoading || loading) return null;
  if (!caseData) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/cases" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Cases
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {caseData.title}
              </h1>
              <p className="text-gray-600 mb-6">{caseData.description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Priority</p>
                  <p
                    className={`text-lg font-semibold ${
                      caseData.priority === 'critical'
                        ? 'text-red-600'
                        : caseData.priority === 'high'
                        ? 'text-orange-600'
                        : caseData.priority === 'medium'
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}
                  >
                    {caseData.priority.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Created</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(caseData.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Comments
              </h2>

              <form onSubmit={handleAddComment} className="mb-6">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-3"
                  disabled={submitting}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
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
                      <p className="text-sm text-gray-500">
                        {comment.user?.email} on{' '}
                        {new Date(comment.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-gray-900 mt-1">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No comments yet</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Activity Log
              </h2>
              <div className="space-y-3">
                {activity.length > 0 ? (
                  activity.map((log) => (
                    <div key={log.id} className="border-l-4 border-gray-300 pl-4">
                      <p className="text-sm text-gray-500">
                        {log.user?.email} - {log.action}
                      </p>
                      <p className="text-gray-600 text-sm mt-1">
                        {log.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No activity yet</p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Details</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Status</p>
                  {canEdit ? (
                    <select
                      value={caseData.status_id}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black"
                    >
                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-1 font-medium text-gray-900">
                      {caseData.status?.name}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 font-medium">Assigned To</p>
                  {canEdit ? (
                    <select
                      value={caseData.assigned_to || ''}
                      onChange={(e) =>
                        handleAssignChange(e.target.value || null)
                      }
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black"
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.email}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-1 font-medium text-gray-900">
                      {caseData.assigned_user?.email || 'Unassigned'}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 font-medium">Created By</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {caseData.created_user?.email}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 font-medium">Created At</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {new Date(caseData.created_at).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 font-medium">Updated At</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {new Date(caseData.updated_at).toLocaleString()}
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
