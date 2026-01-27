'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useNCRStore } from '@/lib/store';
import { getNCRs, getMyNCRs, canCreateNCR, canViewAllNCRs } from '@/lib/api';
import { STAGE_INFO, getRoleLabel, WorkflowStage } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Select } from '@/components/FormElements';

export default function NCRsPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { ncrs, setNCRs } = useNCRStore();
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [viewMode, setViewMode] = useState<'my' | 'all'>('my');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const loadData = async () => {
      if (!user) return;
      try {
        if (viewMode === 'all' && canViewAllNCRs(user.role)) {
          const allNCRs = await getNCRs();
          setNCRs(allNCRs);
        } else {
          const myNCRs = await getMyNCRs(user);
          setNCRs(myNCRs);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user) {
      loadData();
    }
  }, [isAuthenticated, isLoading, router, setNCRs, user, viewMode]);

  if (isLoading || loading || !user) return null;

  const filteredNCRs = ncrs.filter((n) => {
    if (filterStage && n.workflow_stage !== filterStage) return false;
    if (filterPriority && n.priority !== filterPriority) return false;
    return true;
  });

  const stageOptions = Object.entries(STAGE_INFO).map(([key, value]) => ({
    value: key,
    label: value.label,
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">NCRs</h1>
          <div className="flex gap-4">
            {canViewAllNCRs(user.role) && (
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                <button
                  onClick={() => setViewMode('my')}
                  className={`px-4 py-2 text-sm font-medium ${
                    viewMode === 'my'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  My NCRs
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-4 py-2 text-sm font-medium ${
                    viewMode === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  All NCRs
                </button>
              </div>
            )}
            {canCreateNCR(user.role) && (
              <Link href="/cases/new">
                <Button variant="primary">New NCR</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Filter by Stage"
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              options={stageOptions}
            />
            <Select
              label="Filter by Priority"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]}
            />
          </div>
        </div>

        {/* NCR Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NCR #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNCRs.length > 0 ? (
                filteredNCRs.map((ncr) => {
                  const stageInfo = STAGE_INFO[ncr.workflow_stage as WorkflowStage] || {
                    label: ncr.workflow_stage,
                    color: '#6B7280',
                  };
                  return (
                    <tr key={ncr.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {ncr.ncr_number || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ncr.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: stageInfo.color + '20',
                            color: stageInfo.color,
                          }}
                        >
                          {stageInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ncr.priority === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : ncr.priority === 'high'
                              ? 'bg-orange-100 text-orange-800'
                              : ncr.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {ncr.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ncr.assigned_role ? getRoleLabel(ncr.assigned_role) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(ncr.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/cases/${ncr.id}`}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No NCRs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
