import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  role: "customer" | "maker" | "admin";
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => {
        // Store in localStorage with the correct key
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
        }
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        // Remove from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
        set({ token: null, user: null, isAuthenticated: false });
      },
      setUser: (user) => set({ user }),
    }),
    { 
      name: "rwc-auth",
      // Also keep the token in localStorage for legacy API compatibility
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== 'undefined') {
          const token = state.token;
          if (token) {
            localStorage.setItem('auth_token', token);
          }
        }
      }
    }
  )
);
