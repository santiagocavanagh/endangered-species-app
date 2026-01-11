import { User } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";

interface HeaderProps {
  activeCategory: "animal" | "planta" | "hongo";
  onCategoryChange: (category: "animal" | "planta" | "hongo") => void;
}

export function Header({ activeCategory, onCategoryChange }: HeaderProps) {
  const categories = [
    { id: "animal" as const, label: "Animales" },
    { id: "planta" as const, label: "Plantas" },
    { id: "hongo" as const, label: "Hongos" },
  ];

  return (
    <header className="w-full border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-semibold text-gray-900">
            Especies en Peligro
          </h1>
          <nav className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-emerald-100">
              <User className="h-5 w-5 text-emerald-700" />
            </AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <p className="font-medium text-gray-900">Usuario</p>
            <p className="text-xs text-gray-500">usuario@ejemplo.com</p>
          </div>
        </div>
      </div>
    </header>
  );
}
