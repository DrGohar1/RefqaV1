// VITE_API_URL: set in environment variables to point to your backend server
// e.g., https://rafaqaa-api.onrender.com
// Leave empty to use relative /api path (same server)
const EXTERNAL_API = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
const BASE = EXTERNAL_API ? `${EXTERNAL_API.replace(/\/$/, "")}/api` : "/api";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {};

  if (
    options.body &&
    typeof options.body === "string" &&
    !(options.headers as Record<string, string>)?.["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { ...headers, ...(options.headers as Record<string, string>) },
    ...options,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const err = await res.json();
      message = err.message || err.error || message;
    } catch {}
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as T;
}

export const api = {
  get: <T = unknown>(path: string) => apiFetch<T>(path),
  post: <T = unknown>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T = unknown>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T = unknown>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T = unknown>(path: string) =>
    apiFetch<T>(path, { method: "DELETE" }),
};

export default api;
