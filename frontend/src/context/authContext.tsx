import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  email: string;
  name?: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: User | null;
  login: (token: string, role: "admin" | "user", email: string, name?: string) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole") as "admin" | "user";
    const email = localStorage.getItem("userEmail");
    const name = localStorage.getItem("userName");

    if (token && role && email) {
      setUser({ email, role: role as "admin" | "user", name: name || undefined });
    }
    setLoading(false);
  }, []);

  const login = (token: string, role: "admin" | "user", email: string, name?: string) => {
  localStorage.setItem("token", token);
  localStorage.setItem("userRole", role);
  localStorage.setItem("userEmail", email);
  
  if (name) {
    localStorage.setItem("userName", name);
  } else {
    localStorage.removeItem("userName");
  }
  
  setUser({ email, role, name });
};

const logout = () => {
    localStorage.clear();
    setUser(null);
  };

return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === "admin" }}>
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