import { useState } from "react";
import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useAuth } from "../../context/AuthContext";
import { LoginModal } from "./login-modal";
import { RegisterModal } from "./register-modal";
import { ProfileModal } from "./profile-modal";

interface HeaderProps {
  activeCategory: "animal" | "planta" | "hongo";
  onCategoryChange: (category: "animal" | "planta" | "hongo") => void;
}

export function Header({ activeCategory, onCategoryChange }: HeaderProps) {
  const { user, logout, isAdmin } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false); //abrir el modal
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const categories = [
    { id: "animal" as const, label: "Animales" },
    { id: "planta" as const, label: "Plantas" },
    { id: "hongo" as const, label: "Hongos" },
  ];

  return (
    <header className="w-full border-b bg-white px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        
        {/* Seccion Categorías */}
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

        {/* Seccion Usuario */}
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              {/* Boton dinamico de perfil */}
              <button onClick={() => setIsProfileOpen(true)} 
              className="flex items-center gap-2 group transition-all">
                <Avatar className="w-8 h-8 bg-emerald-100 border border-emerald-200">
                  <AvatarFallback className="text-emerald-700 font-bold text-xs">
                    {/* Muestra la inicial del nombre o del email */}
                      {(user.name?.[0] || user.email[0]).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start leading-none hidden sm:flex">
                  <span className="text-gray-900 font-semibold text-sm group-hover:text-emerald-600 transition-colors">
                    {user.name || user.email.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase mt-0.5">
                    {isAdmin ? "Admin" : "Explorador"}
                  </span>
                </div>
              </button>
              
              {/* Botón Logout */}
              <button onClick={logout}
              className="p-2 rounded-full hover:bg-yellow-90 text-gray-400 hover:text-green-600 transition-colors"
              title="Cerrar sesión">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => setIsLoginOpen(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 
              transition-all shadow-sm font-medium text-sm">
              Iniciar Sesión
            </button>
            <button onClick={() => setIsRegisterOpen(true)}
              className="px-4 py-2 bg-white border border-emerald-600 text-emerald-600 rounded-md hover:bg-emerald-50 transition-all text-sm font-medium">
              Registrarse
            </button>
          </div>
          )}
        </div>
      </div>
        
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </header>
    );
  }