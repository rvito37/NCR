import { create } from 'zustand';
import { AuthUser } from './types';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: AuthUser | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  setUser: (user) => set({ user, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clear: () => set({ user: null, isLoading: false, error: null }),
}));

interface CaseState {
  cases: any[];
  isLoading: boolean;
  error: string | null;
  setCases: (cases: any[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  addCase: (caseItem: any) => void;
  updateCase: (caseId: string, updates: any) => void;
  deleteCase: (caseId: string) => void;
}

export const useCaseStore = create<CaseState>((set) => ({
  cases: [],
  isLoading: false,
  error: null,
  setCases: (cases) => set({ cases, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addCase: (caseItem) =>
    set((state) => ({ cases: [caseItem, ...state.cases] })),
  updateCase: (caseId, updates) =>
    set((state) => ({
      cases: state.cases.map((c) =>
        c.id === caseId ? { ...c, ...updates } : c
      ),
    })),
  deleteCase: (caseId) =>
    set((state) => ({
      cases: state.cases.filter((c) => c.id !== caseId),
    })),
}));
