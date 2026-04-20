"use client";

import { create } from "zustand";
import type { User } from "@/types";

type AuthState = {
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  setSession: (session: { user: User; accessToken: string; refreshToken: string }) => void;
  updateUser: (user: User) => void;
  clearSession: () => void;
  hydrate: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  setSession: (session) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("surevision.user", JSON.stringify(session.user));
      window.localStorage.setItem("surevision.accessToken", session.accessToken);
      window.localStorage.setItem("surevision.refreshToken", session.refreshToken);
    }
    set(session);
  },
  updateUser: (user) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("surevision.user", JSON.stringify(user));
    }
    set((state) => ({ ...state, user }));
  },
  clearSession: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("surevision.user");
      window.localStorage.removeItem("surevision.accessToken");
      window.localStorage.removeItem("surevision.refreshToken");
    }
    set({ user: undefined, accessToken: undefined, refreshToken: undefined });
  },
  hydrate: () => {
    if (typeof window === "undefined") return;
    const rawUser = window.localStorage.getItem("surevision.user");
    const accessToken = window.localStorage.getItem("surevision.accessToken") ?? undefined;
    const refreshToken = window.localStorage.getItem("surevision.refreshToken") ?? undefined;
    set({
      user: rawUser ? (JSON.parse(rawUser) as User) : undefined,
      accessToken,
      refreshToken
    });
  }
}));
