import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  email: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: User | null;
  login: (token: string, role: "admin" | "user", email: string) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole") as "admin" | "user";
    const email = localStorage.getItem("userEmail");

    if (token && role && email) {
      setUser({ email, role });
    }
  }, []);

  const login = (token: string, role: "admin" | "user", email: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userRole", role);
    localStorage.setItem("userEmail", email);
    setUser({ email, role });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
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