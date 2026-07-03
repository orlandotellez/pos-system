import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, type AuthUser } from "@/api/auth";

const REFRESH_INTERVAL = 14 * 60 * 1000;

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("auth-user");
      return stored ? JSON.parse(stored) : null;
    } catch (err) {
      console.warn("[Auth] Error al restaurar sesión de localStorage:", err);
      localStorage.removeItem("auth-user");
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        const refreshToken = localStorage.getItem("auth-refresh-token") ?? undefined;
        const res = await authApi.refresh(refreshToken || undefined);
        setUser(res.user);
        localStorage.setItem("auth-user", JSON.stringify(res.user));
        localStorage.setItem("auth-token", res.accessToken);
        localStorage.setItem("auth-refresh-token", res.refreshToken);
      } catch (err) {
        console.warn("[Auth] Error al refrescar sesión:", err);
        setUser(null);
        localStorage.removeItem("auth-token");
        localStorage.removeItem("auth-refresh-token");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const refreshToken = localStorage.getItem("auth-refresh-token");
      if (!refreshToken) return;

      authApi.refresh(refreshToken)
        .then((res) => {
          setUser(res.user);
          localStorage.setItem("auth-user", JSON.stringify(res.user));
          localStorage.setItem("auth-token", res.accessToken);
          localStorage.setItem("auth-refresh-token", res.refreshToken);
        })
        .catch((err) => {
          console.warn("[Auth] Background refresh failed:", err?.status ?? "", err?.message ?? "");
        });
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem("auth-user", JSON.stringify(user));
    } else {
      localStorage.removeItem("auth-user");
    }
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      setUser(res.user);
      localStorage.setItem("auth-token", res.accessToken);
      localStorage.setItem("auth-refresh-token", res.refreshToken);
      navigate("/pos");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) { console.warn("[Auth] Error al hacer logout:", err); }
    setUser(null);
    localStorage.removeItem("auth-token");
    localStorage.removeItem("auth-refresh-token");
    navigate("/auth");
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
