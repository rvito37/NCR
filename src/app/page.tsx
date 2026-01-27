'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/Button';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
      <div className="text-center text-white max-w-2xl">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          NCR Jerusalem System
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-blue-100">
          Non-Conformance Report management system with workflow automation, role-based approvals, and complete audit trail.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push('/auth/login')}
          >
            Sign In
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push('/auth/signup')}
          >
            Create Account
          </Button>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2">Workflow</h3>
            <p className="text-blue-100">Automated routing through PE, EM, PM, OM, QA approval chain</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2">Role-Based</h3>
            <p className="text-blue-100">Each role sees only relevant NCRs and available actions</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2">Traceable</h3>
            <p className="text-blue-100">Complete history of decisions, comments, and transitions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
