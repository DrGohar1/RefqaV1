import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api-client";

interface AdminUser {
  id: string;
  username: string;
  email?: string;
  role: "admin" | "moderator";
}

interface AuthContextType {
  user: AdminUser | null;
  session: { user: AdminUser } | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      const data = await api.get<{ user: AdminUser }>("/auth/me");
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const data = await api.post<{ user: AdminUser }>("/auth/login", { username, password });
      setUser(data.user);
      return { error: null };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const signOut = async () => {
    try {
      await api.post("/auth/logout", {});
    } catch {}
    setUser(null);
  };

  const session = user ? { user } : null;

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, signIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
