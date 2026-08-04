import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";
import type { JwtPayload, AuthUser } from "../lib/auth/types";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;

  /** Store a new token, decode it and set the user. */
  setToken: (token: string) => void;

  /** Clear session. */
  logout: () => void;

  /** Returns true when token exists and has not expired. */
  isTokenValid: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setToken: (token: string) => {
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          const now = Date.now();
          if (now >= decoded.exp * 1000) {
            // Token already expired on arrival — reject it
            set({ token: null, user: null, isAuthenticated: false });
            return;
          }
          const user: AuthUser = {
            name: decoded.name,
            email: decoded.email,
            roleId: decoded.role_id,
            extensionNumber: decoded.extension_number,
          };
          set({ token, user, isAuthenticated: true });
        } catch {
          set({ token: null, user: null, isAuthenticated: false });
        }
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },

      isTokenValid: () => {
        const { token } = get();
        if (!token) return false;
        try {
          const { exp } = jwtDecode<JwtPayload>(token);
          return Date.now() < exp * 1000;
        } catch {
          return false;
        }
      },
    }),
    {
      name: "atc-auth",
      // Only persist token + user, recompute isAuthenticated on rehydration
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Validate token after hydration from localStorage
        if (state.token) {
          try {
            const { exp } = jwtDecode<JwtPayload>(state.token);
            if (Date.now() < exp * 1000) {
              state.isAuthenticated = true;
              return;
            }
          } catch {
            // invalid token — fall through to clear
          }
        }
        // Expired or invalid
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
      },
    }
  )
);
