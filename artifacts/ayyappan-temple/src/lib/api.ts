const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as any).error || res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: () => apiFetch("/auth/logout", { method: "POST" }),
  me: () => apiFetch("/auth/me"),

  // Public
  getDonationStats: () => apiFetch("/donations/stats"),
  getApprovedDonors: () => apiFetch("/donations/approved"),
  getNews: () => apiFetch("/news"),
  getEvents: () => apiFetch("/events"),
  getSettings: () => apiFetch<Record<string, string>>("/settings"),
  submitDonation: (data: Record<string, unknown>) =>
    apiFetch("/donations", { method: "POST", body: JSON.stringify(data) }),

  // Admin - Donations
  getAllDonations: (status?: string) =>
    apiFetch(`/donations${status ? `?status=${status}` : ""}`),
  approveDonation: (id: number) =>
    apiFetch(`/donations/${id}/approve`, { method: "PATCH" }),
  rejectDonation: (id: number, reason?: string) =>
    apiFetch(`/donations/${id}/reject`, { method: "PATCH", body: JSON.stringify({ reason }) }),
  deleteDonation: (id: number) =>
    apiFetch(`/donations/${id}`, { method: "DELETE" }),

  // Admin - Dashboard
  getDashboardStats: () => apiFetch("/dashboard/stats"),

  // Admin - News
  getAllNews: () => apiFetch("/news/all"),
  createNews: (data: Record<string, unknown>) =>
    apiFetch("/news", { method: "POST", body: JSON.stringify(data) }),
  updateNews: (id: number, data: Record<string, unknown>) =>
    apiFetch(`/news/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteNews: (id: number) => apiFetch(`/news/${id}`, { method: "DELETE" }),

  // Admin - Events
  getAllEvents: () => apiFetch("/events/all"),
  createEvent: (data: Record<string, unknown>) =>
    apiFetch("/events", { method: "POST", body: JSON.stringify(data) }),
  updateEvent: (id: number, data: Record<string, unknown>) =>
    apiFetch(`/events/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteEvent: (id: number) => apiFetch(`/events/${id}`, { method: "DELETE" }),

  // Admin - Settings
  updateSettings: (data: Record<string, string>) =>
    apiFetch("/settings", { method: "PATCH", body: JSON.stringify(data) }),

  // Admin - Create admin user
  createAdmin: (data: Record<string, unknown>) =>
    apiFetch("/auth/create-admin", { method: "POST", body: JSON.stringify(data) }),
};
