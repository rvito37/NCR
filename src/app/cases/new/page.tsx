'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createNCR, canCreateNCR } from '@/lib/api';
import { Priority } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Input, Select, Textarea } from '@/components/FormElements';

export default function NewNCRPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!isLoading && user && !canCreateNCR(user.role)) {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, isLoading, router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) return;

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSubmitting(true);

    try {
      const { data, error: apiError } = await createNCR(
        title,
        description,
        priority,
        user.id
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

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/cases" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          &larr; Back to NCRs
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New NCR</h1>
          <p className="text-gray-600 mb-6">
            Create a Non-Conformance Report. After creation, you can submit it for review.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="NCR Title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={submitting}
              placeholder="Brief description of the non-conformance"
            />

            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              placeholder="Detailed description of the non-conformance issue..."
              rows={6}
            />

            <Select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              disabled={submitting}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
              <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
                <li>NCR will be created as a <strong>Draft</strong></li>
                <li>You can edit and then <strong>Submit</strong> it</li>
                <li>It will be routed to <strong>Process Engineer</strong> for review</li>
                <li>The workflow continues through the approval chain</li>
              </ol>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={submitting}
              >
                Create NCR
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
