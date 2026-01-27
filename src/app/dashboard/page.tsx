'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useNCRStore } from '@/lib/store';
import { getMyNCRs, getNCRs, canCreateNCR, canViewAllNCRs } from '@/lib/api';
import { STAGE_INFO, getRoleLabel } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/Button';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { ncrs, setNCRs } = useNCRStore();
  const [loading, setLoading] = useState(true);
  const [allNCRs, setAllNCRs] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const loadNCRs = async () => {
      if (!user) return;
      try {
        const myNCRs = await getMyNCRs(user);
        setNCRs(myNCRs);

        if (canViewAllNCRs(user.role)) {
          const all = await getNCRs();
          setAllNCRs(all);
        } else {
          setAllNCRs(myNCRs);
        }
      } catch (error) {
        console.error('Failed to load NCRs:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user) {
      loadNCRs();
    }
  }, [isAuthenticated, isLoading, router, setNCRs, user]);

  if (isLoading || loading || !user) return null;

  // Group by workflow stage
  const ncrsByStage = ncrs.reduce((acc, ncr) => {
    const stage = ncr.workflow_stage;
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(ncr);
    return acc;
  }, {} as Record<string, any[]>);

  // Stats
  const stats = {
    total: allNCRs.length,
    myPending: ncrs.filter((n) => n.final_status === 'in_progress').length,
    approved: allNCRs.filter((n) => n.final_status === 'approved').length,
    inRework: allNCRs.filter((n) => n.workflow_stage === 'rework').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome, {user.display_name || user.email} ({getRoleLabel(user.role)})
            </p>
          </div>
          {canCreateNCR(user.role) && (
            <Link href="/cases/new">
              <Button variant="primary">New NCR</Button>
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">Total NCRs</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">My Pending</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.myPending}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">Approved</h3>
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">In Rework</h3>
            <p className="text-3xl font-bold text-red-600">{stats.inRework}</p>
          </div>
        </div>

        {/* My NCRs by Stage */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">My NCRs</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.entries(ncrsByStage).map(([stage, stageNCRs]) => {
            const stageInfo = STAGE_INFO[stage as keyof typeof STAGE_INFO] || { label: stage, color: '#6B7280' };
            return (
              <div key={stage} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stageInfo.color }}
                  />
                  <h2 className="text-lg font-bold text-gray-900">{stageInfo.label}</h2>
                  <span className="ml-auto bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                    {(stageNCRs as any[]).length}
                  </span>
                </div>
                <div className="space-y-3">
                  {(stageNCRs as any[]).length > 0 ? (
                    (stageNCRs as any[]).slice(0, 5).map((ncr) => (
                      <Link
                        key={ncr.id}
                        href={`/cases/${ncr.id}`}
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-gray-900">{ncr.title}</p>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              ncr.priority === 'critical'
                                ? 'bg-red-100 text-red-700'
                                : ncr.priority === 'high'
                                ? 'bg-orange-100 text-orange-700'
                                : ncr.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {ncr.priority.toUpperCase()}
                          </span>
                        </div>
                        {ncr.ncr_number && (
                          <p className="text-xs text-gray-500 mt-1">{ncr.ncr_number}</p>
                        )}
                      </Link>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No NCRs</p>
                  )}
                </div>
                {(stageNCRs as any[]).length > 5 && (
                  <Link
                    href={`/cases?stage=${stage}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-4 inline-block"
                  >
                    View all {(stageNCRs as any[]).length} NCRs
                  </Link>
                )}
              </div>
            );
          })}

          {Object.keys(ncrsByStage).length === 0 && (
            <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">No NCRs assigned to you</p>
              {canCreateNCR(user.role) && (
                <Link href="/cases/new" className="mt-4 inline-block">
                  <Button variant="primary">Create your first NCR</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
