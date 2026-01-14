import * as React from "react";
import { useAuth } from "../../context/AuthContext";
import { 
  NavigationMenu, 
  NavigationMenuList, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  navigationMenuTriggerStyle 
} from "./ui/navigation-menu";
import { LoginModal } from "./login-modal";
import { User, LogOut, Leaf } from "lucide-react";
import { cn } from "./ui/utils";

export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = React.useState(false);

  return (
    <header className={cn("sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60")}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        {/* Logo */}
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="bg-green-600 p-1 rounded-md">
            <Leaf className="text-white h-5 w-5" />
          </div>
          <span className="tracking-tight text-green-900">EcoGuard</span>
        </div>

        {/* Sección de Usuario */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">{user.email.split('@')[0]}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">
                  {isAdmin ? "Admin" : "Explorador"}
                </p>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-full hover:bg-red-100/50 text-muted-foreground hover:text-red-600 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-800 transition-colors"
            >
              <User className="h-4 w-4" />
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </header>
  );
}