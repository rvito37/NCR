'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  createCase,
  getCaseStatuses,
  getDefaultStatus,
  getAllUsers,
} from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Input, Select, Textarea } from '@/components/FormElements';

export default function NewCasePage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [statusId, setStatusId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [statuses, setStatuses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const loadData = async () => {
      try {
        const [caseStatuses, allUsers, defaultStatus] = await Promise.all([
          getCaseStatuses(),
          getAllUsers(),
          getDefaultStatus(),
        ]);

        setStatuses(caseStatuses);
        setUsers(allUsers);
        if (defaultStatus) {
          setStatusId(defaultStatus.id);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) return;

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!statusId) {
      setError('Status is required');
      return;
    }

    setSubmitting(true);

    try {
      const { data, error: apiError } = await createCase(
        title,
        description,
        priority as 'low' | 'medium' | 'high' | 'critical',
        statusId,
        user.id,
        assignedTo || undefined
      );

      if (apiError) {
        setError(apiError.message);
        return;
      }

      if (data) {
        router.push(`/cases/${data.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loading) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/cases" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Cases
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Case</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Case Title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={submitting}
              placeholder="Enter case title"
            />

            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              placeholder="Enter case description"
              rows={4}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={submitting}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'critical', label: 'Critical' },
                ]}
              />

              <Select
                label="Status"
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                disabled={submitting}
                options={statuses.map((s) => ({
                  value: s.id,
                  label: s.name,
                }))}
              />
            </div>

            <Select
              label="Assign To (Optional)"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              disabled={submitting}
              options={users.map((u) => ({
                value: u.id,
                label: u.email,
              }))}
            />

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={submitting}
              >
                Create Case
              </Button>
              <Link href="/cases">
                <Button variant="secondary" size="md">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
