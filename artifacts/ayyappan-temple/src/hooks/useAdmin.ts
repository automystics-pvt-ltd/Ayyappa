import { useState, useEffect, createContext, useContext } from "react";
import { api } from "@/lib/api";

export interface AdminUser {
  adminId: number;
  role: string;
  displayName: string;
}

export const AdminContext = createContext<{
  admin: AdminUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}>({
  admin: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function useAdmin() {
  return useContext(AdminContext);
}

export function useAdminState() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me()
      .then((data) => setAdmin(data as AdminUser))
      .catch(() => setAdmin(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const data = await api.login(username, password);
    // re-fetch me
    const me = await api.me();
    setAdmin(me as AdminUser);
  };

  const logout = async () => {
    await api.logout();
    setAdmin(null);
  };

  return { admin, loading, login, logout };
}
