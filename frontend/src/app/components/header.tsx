import { useState } from "react";
import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useAuth } from "../../context/AuthContext";
import { LoginModal } from "./login-modal";

interface HeaderProps {
  activeCategory: "animal" | "planta" | "hongo";
  onCategoryChange: (category: "animal" | "planta" | "hongo") => void;
}

export function Header({ activeCategory, onCategoryChange }: HeaderProps) {
  const { user, logout, isAdmin } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false); //abrir el modal

  const categories = [
    { id: "animal" as const, label: "Animales" },
    { id: "planta" as const, label: "Plantas" },
    { id: "hongo" as const, label: "Hongos" },
  ];

  return (
    <header className="w-full border-b bg-white px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        
        {/* Logo y Categorías */}
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold text-green-900 tracking-tight">
            EcoGuard
          </h1>
          <nav className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Sección de Usuario */}
        <div className="flex items-center gap-4">
          {user ? (
            /* Login */
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none text-gray-900">
                  {isAdmin ? "Admin" : "Explorador"}
                </p>
                <p className="text-[11px] text-gray-500 mt-1">{user.email}</p>
              </div>
              <Avatar className="h-9 w-9 border border-emerald-100">
                <AvatarFallback className="bg-emerald-100 text-emerald-700">
                  {user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={logout}
                className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            /* Logout */
            <button
              onClick={() => setIsLoginOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-800 transition-colors"
            >
              <User size={16} />
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </header>
  );
}