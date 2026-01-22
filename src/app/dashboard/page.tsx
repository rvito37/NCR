'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCaseStore } from '@/lib/store';
import { getCases } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/Button';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { cases, setCases } = useCaseStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const loadCases = async () => {
      try {
        const allCases = await getCases();
        setCases(allCases);
      } catch (error) {
        console.error('Failed to load cases:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      loadCases();
    }
  }, [isAuthenticated, isLoading, router, setCases]);

  if (isLoading || loading) return null;

  const casesByStatus = cases.reduce((acc, caseItem) => {
    const status = caseItem.status?.name || 'Unknown';
    if (!acc[status]) acc[status] = [];
    acc[status].push(caseItem);
    return acc;
  }, {} as Record<string, any[]>);

  const stats = {
    total: cases.length,
    assigned: cases.filter((c) => c.assigned_to === user?.id).length,
    created: cases.filter((c) => c.created_by === user?.id).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <Link href="/cases/new">
            <Button variant="primary">New Case</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">Total Cases</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">Assigned to You</h3>
            <p className="text-3xl font-bold text-green-600">{stats.assigned}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">Created by You</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.created}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(casesByStatus).map(([status, statusCases]) => (
            <div key={status} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{status}</h2>
              <div className="space-y-3">
                {(statusCases as any[]).length > 0 ? (
                  (statusCases as any[]).slice(0, 5).map((caseItem) => (
                    <Link
                      key={caseItem.id}
                      href={`/cases/${caseItem.id}`}
                      className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <p className="font-medium text-gray-900">{caseItem.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Priority:{' '}
                        <span className={`font-medium ${
                          caseItem.priority === 'critical' ? 'text-red-600' :
                          caseItem.priority === 'high' ? 'text-orange-600' :
                          caseItem.priority === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {caseItem.priority.toUpperCase()}
                        </span>
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No cases</p>
                )}
              </div>
              {(statusCases as any[]).length > 5 && (
                <Link
                  href={`/cases?status=${status}`}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-4 inline-block"
                >
                  View all {(statusCases as any[]).length} cases
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
