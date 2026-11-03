import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

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

interface AuthContextType {
  user: User | null;
  login: (role: string, email: string, name?: string | null) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // El JWT vive en una cookie httpOnly (no accesible por JS), así que la sesión se
  // restaura preguntándole al backend "¿quién soy?" en vez de decodificar un token local.
  useEffect(() => {
    let cancelled = false;

    api.me().then((data) => {
      if (cancelled) return;
      if (data) {
        setUser({
          email: data.email,
          role: normalizeRole(data.role),
          name: data.name ?? undefined,
        });
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = (role: string, email: string, name?: string | null) => {
    setUser({ email, role: normalizeRole(role), name: name ?? undefined });
  };

  const logout = () => {
    setUser(null);
    void api.logout();
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
