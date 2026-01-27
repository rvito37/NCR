import { create } from 'zustand';
import { User, NCR } from './types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
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

interface NCRState {
  ncrs: NCR[];
  isLoading: boolean;
  error: string | null;
  setNCRs: (ncrs: NCR[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  addNCR: (ncr: NCR) => void;
  updateNCR: (ncrId: string, updates: Partial<NCR>) => void;
  deleteNCR: (ncrId: string) => void;
}

export const useNCRStore = create<NCRState>((set) => ({
  ncrs: [],
  isLoading: false,
  error: null,
  setNCRs: (ncrs) => set({ ncrs, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addNCR: (ncr) =>
    set((state) => ({ ncrs: [ncr, ...state.ncrs] })),
  updateNCR: (ncrId, updates) =>
    set((state) => ({
      ncrs: state.ncrs.map((n) =>
        n.id === ncrId ? { ...n, ...updates } : n
      ),
    })),
  deleteNCR: (ncrId) =>
    set((state) => ({
      ncrs: state.ncrs.filter((n) => n.id !== ncrId),
    })),
}));
