const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

export interface AdminUser {
  id: number;
  username: string;
  role: string;
  displayName: string | null;
  createdAt: string;
  lastLogin: string | null;
}

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

/**
 * Upload a file directly to GCS via presigned URL.
 * Returns the objectPath to store in the database.
 */
export async function uploadScreenshot(file: File): Promise<string> {
  // Step 1: request presigned URL from our API
  const { uploadURL, objectPath } = await apiFetch<{ uploadURL: string; objectPath: string }>(
    "/donations/upload-screenshot-url",
    {
      method: "POST",
      body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
    }
  );

  // Step 2: upload file directly to GCS (no auth header, no Content-Type application/json override)
  const uploadRes = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!uploadRes.ok) throw new Error("Screenshot upload failed");

  return objectPath;
}

/**
 * Upload a QR code image to GCS via presigned URL (admin only).
 * Returns the objectPath to store in settings as qr_code_url.
 */
export async function uploadQrCode(file: File): Promise<string> {
  const { uploadURL, objectPath } = await apiFetch<{ uploadURL: string; objectPath: string }>(
    "/settings/upload-qr-url",
    { method: "POST", body: JSON.stringify({ size: file.size, contentType: file.type }) }
  );
  const uploadRes = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!uploadRes.ok) throw new Error("QR code upload failed");
  return objectPath;
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

  // Public - Visitor counter
  trackVisit: () => apiFetch("/visits/track", { method: "POST" }),
  getVisitorCount: () => apiFetch<{ total: number; today: number }>("/visits/count"),

  // Public - Donation receipt by non-guessable UUID token
  getDonationReceipt: (token: string) => apiFetch(`/donations/receipt/${token}`),

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

  // Public - In-kind contributions
  getContributions: () => apiFetch("/contributions"),

  // Admin - In-kind contributions
  getAllContributions: () => apiFetch("/contributions/all"),
  createContribution: (data: Record<string, unknown>) =>
    apiFetch("/contributions", { method: "POST", body: JSON.stringify(data) }),
  updateContribution: (id: number, data: Record<string, unknown>) =>
    apiFetch(`/contributions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteContribution: (id: number) =>
    apiFetch(`/contributions/${id}`, { method: "DELETE" }),

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

  // Admin - List / manage admin users (super_admin only)
  listAdmins: () => apiFetch<AdminUser[]>("/auth/admins"),
  createAdmin: (data: Record<string, unknown>) =>
    apiFetch("/auth/create-admin", { method: "POST", body: JSON.stringify(data) }),
  updateAdmin: (id: number, data: { role?: string; displayName?: string }) =>
    apiFetch(`/auth/admins/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteAdmin: (id: number) =>
    apiFetch(`/auth/admins/${id}`, { method: "DELETE" }),
  resetAdminPassword: (id: number, newPassword: string) =>
    apiFetch(`/auth/admins/${id}/reset-password`, { method: "PATCH", body: JSON.stringify({ newPassword }) }),

  // Admin - Change own password
  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch("/auth/change-password", { method: "PATCH", body: JSON.stringify({ currentPassword, newPassword }) }),

  // Screenshot / object storage URL helper (admin-only, requires auth)
  screenshotUrl: (objectPath: string) =>
    `${API_BASE}/storage${objectPath}`,

  // Public gallery photo URL — served via the unauthenticated gallery-objects route
  // objectPath is like /objects/bucket/uploads/uuid → /storage/gallery-objects/bucket/uploads/uuid
  storageUrl: (objectPath: string) => {
    const withoutPrefix = objectPath.startsWith('/objects/')
      ? objectPath.slice('/objects/'.length)
      : objectPath;
    return `${API_BASE}/storage/gallery-objects/${withoutPrefix}`;
  },

  // Public - Gallery
  getPublicAlbums: () => apiFetch<unknown[]>("/gallery/albums"),
  getAlbumPhotos: (albumId: number) => apiFetch<unknown[]>(`/gallery/albums/${albumId}/photos`),

  // Admin - Gallery
  getAdminAlbums: () => apiFetch("/gallery/admin/albums"),
  getGalleryUploadUrl: (contentType: string, size: number) =>
    apiFetch("/gallery/upload-url", {
      method: "POST",
      body: JSON.stringify({ contentType, size }),
    }),
  createAlbum: (data: Record<string, unknown>) =>
    apiFetch("/gallery/albums", { method: "POST", body: JSON.stringify(data) }),
  updateAlbum: (id: number, data: Record<string, unknown>) =>
    apiFetch(`/gallery/albums/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteAlbum: (id: number) =>
    apiFetch(`/gallery/albums/${id}`, { method: "DELETE" }),
  addPhoto: (data: Record<string, unknown>) =>
    apiFetch("/gallery/photos", { method: "POST", body: JSON.stringify(data) }),
  updatePhoto: (id: number, data: Record<string, unknown>) =>
    apiFetch(`/gallery/photos/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deletePhoto: (id: number) =>
    apiFetch(`/gallery/photos/${id}`, { method: "DELETE" }),
};
