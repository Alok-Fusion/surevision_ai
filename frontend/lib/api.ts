import { useAuthStore } from "@/store/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getToken() {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem("surevision.accessToken") ?? undefined;
}

function getRefreshToken() {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem("surevision.refreshToken") ?? undefined;
}

type RequestOptions = RequestInit & {
  auth?: boolean;
};

let refreshPromise: Promise<string | undefined> | null = null;

async function refreshSession() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      useAuthStore.getState().clearSession();
      return undefined;
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store"
    });

    if (!response.ok) {
      useAuthStore.getState().clearSession();
      return undefined;
    }

    const session = (await response.json()) as { accessToken: string; refreshToken: string };
    const currentUser = useAuthStore.getState().user;

    if (currentUser) {
      useAuthStore.getState().setSession({
        user: currentUser,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken
      });
    } else if (typeof window !== "undefined") {
      window.localStorage.setItem("surevision.accessToken", session.accessToken);
      window.localStorage.setItem("surevision.refreshToken", session.refreshToken);
    }

    return session.accessToken;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function request<T>(path: string, options: RequestOptions = {}, allowRefresh = true): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;

  if (!isFormData) headers.set("Content-Type", "application/json");
  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  });

  if (response.status === 401 && options.auth !== false && allowRefresh) {
    const refreshedAccessToken = await refreshSession();
    if (refreshedAccessToken) {
      return request<T>(path, options, false);
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/pdf") || contentType.includes("text/csv")) {
    return response.blob() as Promise<T>;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {})
    }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body: JSON.stringify(body ?? {}) }),
  del: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "DELETE" })
};
