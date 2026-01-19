import { SpeciesCard, type Species } from "./species-card";
import { HeartOff } from "lucide-react";

interface FavoritesViewProps {
  favorites: Species[];
  onToggleFavorite: (id: number) => void;
  onEdit: (species: Species) => void;
}

export function FavoritesView({ favorites, onToggleFavorite, onEdit }: FavoritesViewProps) {
  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <HeartOff size={64} className="mb-4 opacity-20" />
        <h3 className="text-xl font-medium">Aún no tienes favoritos</h3>
        <p>Explora las especies y presiona la estrella para guardarlas aquí.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Mis Especies Favoritas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((species) => (
          <SpeciesCard
            key={species.id}
            species={species}
            isFavorite={true} // Siempre es true aquí
            onToggleFavorite={onToggleFavorite}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}