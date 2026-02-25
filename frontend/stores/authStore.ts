import { create } from "zustand";
import { persist } from "zustand/middleware";

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

function getJwtExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isTokenExpired(expiryMs: number | null): boolean {
  if (!expiryMs) return false;
  return Date.now() >= expiryMs;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      tokenExpiresAt: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => {
        // Security migration note:
        // Preferred auth mode is HttpOnly secure cookie set by backend.
        // Frontend should not store JWT in JS-accessible storage because XSS can exfiltrate it.
        // The localStorage fallback below is temporary for backward compatibility only.
        let nextToken: string | null = null;
        let tokenExpiresAt: number | null = null;

        if (token) {
          tokenExpiresAt = getJwtExpiry(token);
          if (!isTokenExpired(tokenExpiresAt)) {
            nextToken = token;
          }
        }

        if (typeof window !== "undefined") {
          if (nextToken) {
            localStorage.setItem(LEGACY_TOKEN_KEY, nextToken);
            if (tokenExpiresAt) {
              localStorage.setItem(LEGACY_TOKEN_EXP_KEY, String(tokenExpiresAt));
            } else {
              localStorage.removeItem(LEGACY_TOKEN_EXP_KEY);
            }
          } else {
            localStorage.removeItem(LEGACY_TOKEN_KEY);
            localStorage.removeItem(LEGACY_TOKEN_EXP_KEY);
          }
        }

        set({
          token: nextToken,
          tokenExpiresAt,
          user,
          isAuthenticated: true,
        });
      },
      logout: () => {
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
        if (!state || typeof window === "undefined") return;

        const fallbackToken = localStorage.getItem(LEGACY_TOKEN_KEY);
        const expiryRaw = localStorage.getItem(LEGACY_TOKEN_EXP_KEY);
        const expiry = expiryRaw ? Number(expiryRaw) : null;

        if (fallbackToken && !isTokenExpired(expiry)) {
          state.token = fallbackToken;
          state.tokenExpiresAt = expiry;
          state.isAuthenticated = true;
        } else {
          localStorage.removeItem(LEGACY_TOKEN_KEY);
          localStorage.removeItem(LEGACY_TOKEN_EXP_KEY);
          state.token = null;
          state.tokenExpiresAt = null;
        }
      },
    }
  )
);
