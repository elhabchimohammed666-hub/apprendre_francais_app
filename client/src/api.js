const API_URL = import.meta.env.VITE_API_URL ?? "";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Erreur API (${response.status})`);
  }

  return response.status === 204 ? null : response.json();
}
