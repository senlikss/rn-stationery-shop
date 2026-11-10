import { create } from 'zustand';
import type { AuthUser } from '@/services/authentication';
import { useSelectionStore } from '@/stores/selectionStore';

interface AuthState {
  user: AuthUser | null;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  signIn: (user) => set({ user }),
  signOut: () => {
    useSelectionStore.getState().clear();
    set({ user: null });
  },
}));
