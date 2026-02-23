import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  username: string | null;
  isAuthenticated: boolean;
  setTokens: (access: string, refresh: string, username: string) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      username: null,
      isAuthenticated: false,
      setTokens: (access, refresh, username) =>
        set({
          accessToken: access,
          refreshToken: refresh,
          username,
          isAuthenticated: true,
        }),
      setAccessToken: (token) => set({ accessToken: token }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          username: null,
          isAuthenticated: false,
        }),
    }),
    { name: "whattoeat-auth" },
  ),
);
