import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  email: string;
  name?: string;
  role: "admin" | "user";
}

function normalizeRole(role: string | null | undefined): "admin" | "user" {
  return String(role ?? "")
    .trim()
    .toLowerCase() === "admin"
    ? "admin"
    : "user";
}

function parseJwtPayload(token: string | null): Record<string, unknown> | null {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");

    return JSON.parse(atob(payload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

interface AuthContextType {
  user: User | null;
  login: (token: string, role: string, email: string, name?: string) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const payload = parseJwtPayload(token);
    const role = normalizeRole(
      localStorage.getItem("userRole") ??
        (typeof payload?.["role"] === "string" ? payload["role"] : null),
    );
    const email =
      localStorage.getItem("userEmail") ??
      (typeof payload?.["email"] === "string" ? payload["email"] : null);
    const name = localStorage.getItem("userName");

    if (token && role && email) {
      setUser({ email, role, name: name || undefined });
      localStorage.setItem("userRole", role);
      localStorage.setItem("userEmail", email);
    }
    setLoading(false);
  }, []);

  const login = (token: string, role: string, email: string, name?: string) => {
    const normalizedRole = normalizeRole(role);
    localStorage.setItem("token", token);
    localStorage.setItem("userRole", normalizedRole);
    localStorage.setItem("userEmail", email);

    if (name) {
      localStorage.setItem("userName", name);
    } else {
      localStorage.removeItem("userName");
    }

    setUser({ email, role: normalizedRole, name });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAdmin: user?.role === "admin" }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};
