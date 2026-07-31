// Threat model note (STRIDE - Tampering / Info Disclosure via XSS):
// The access token is kept ONLY in a module-level JS variable (memory),
// never in localStorage or sessionStorage. If an XSS bug ever executes
// attacker JS, there is no token sitting in browser storage to steal.
// The refresh token never touches JS at all — it lives in an httpOnly
// cookie set by the backend and is sent automatically via `credentials: "include"`.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function request(path, { method = "GET", body, retry = true } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    credentials: "include", // sends the httpOnly refresh cookie automatically
    body: body ? JSON.stringify(body) : undefined,
  });

  // Access token expired -> try ONE silent refresh, then retry the request.
  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return request(path, { method, body, retry: false });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

async function tryRefresh() {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = await res.json();
    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),
  tryRefresh,
};
