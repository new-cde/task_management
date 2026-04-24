import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { api } from "@/lib/api";

export type Role = "owner" | "admin" | "member";

export interface AuthUser {
  userId: string;
  organizationId: string;
  role: Role;
  name?: string;
  email?: string;
}

interface JwtPayload extends AuthUser {
  exp?: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    organizationName: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decode(token: string): AuthUser | null {
  try {
    const p = jwtDecode<JwtPayload>(token);
    if (p.exp && p.exp * 1000 < Date.now()) return null;
    return {
      userId: p.userId,
      organizationId: p.organizationId,
      role: p.role,
      name: p.name,
      email: p.email,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const t = localStorage.getItem("token");
    return t ? decode(t) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      const u = decode(token);
      if (!u) {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } else {
        setUser(u);
      }
    }
  }, [token]);

  const persist = (t: string) => {
    localStorage.setItem("token", t);
    setToken(t);
    setUser(decode(t));
  };

  const login: AuthContextValue["login"] = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      persist(data.token);
    } finally {
      setLoading(false);
    }
  };

  const register: AuthContextValue["register"] = async (input) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", input);
      persist(data.token);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
