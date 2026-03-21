import { create } from "zustand";
import { persist } from "zustand/middleware";
import { API_BASE } from "@/lib/api-client";

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  role: string;
}

interface AuthState {
  token: string | null;
  tokenExpiresAt: number | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string | null | undefined, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const LEGACY_TOKEN_KEY = "auth_token";
const LEGACY_TOKEN_EXP_KEY = "auth_token_expires_at";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      tokenExpiresAt: null,
      user: null,
      isAuthenticated: false,
      login: (_token, user) => {
        set({
          token: null,
          tokenExpiresAt: null,
          user,
          isAuthenticated: true,
        });
      },
      logout: () => {
        void fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          credentials: "include",
        }).catch(() => undefined);

        if (typeof window !== "undefined") {
          // Thorough cleanup to reduce residual token/session risk.
          localStorage.removeItem(LEGACY_TOKEN_KEY);
          localStorage.removeItem(LEGACY_TOKEN_EXP_KEY);
          localStorage.removeItem("rwc-auth");
          sessionStorage.clear();
        }
        set({ token: null, tokenExpiresAt: null, user: null, isAuthenticated: false });
      },
      setUser: (user) => set({ user, isAuthenticated: true }),
    }),
    {
      name: "rwc-auth",
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        state.token = null;
        state.tokenExpiresAt = null;
      },
    }
  )
);
