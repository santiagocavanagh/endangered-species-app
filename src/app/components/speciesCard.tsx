import { Star, MapPin, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

export interface Species {
  id: string;
  name: string;
  scientificName: string;
  status: "critico" | "peligro" | "vulnerable";
  habitat: string;
  region: string;
  population: string;
  imageUrl: string;
  category: "animal" | "planta" | "hongo";
}

interface SpeciesCardProps {
  species: Species;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export function SpeciesCard({
  species,
  isFavorite,
  onToggleFavorite,
}: SpeciesCardProps) {
  const statusConfig = {
    critico: {
      label: "En peligro crítico",
      color: "bg-red-100 text-red-800 border-red-200",
    },
    peligro: {
      label: "En peligro",
      color: "bg-orange-100 text-orange-800 border-orange-200",
    },
    vulnerable: {
      label: "Vulnerable",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative h-48 overflow-hidden bg-gray-200">
        <img
          src={species.imageUrl}
          alt={species.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button
          onClick={() => onToggleFavorite(species.id)}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-colors"
          aria-label="Agregar a favoritos"
        >
          <Star
            className={`h-5 w-5 ${
              isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-600"
            }`}
          />
        </button>
        <div className="absolute bottom-3 left-3">
          <Badge className={`${statusConfig[species.status].color} border`}>
            <AlertTriangle className="h-3 w-3 mr-1" />
            {statusConfig[species.status].label}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {species.name}
            </h3>
            <p className="text-sm text-gray-500 italic">
              {species.scientificName}
            </p>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{species.region}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm">
              <span className="text-gray-500">Hábitat: </span>
              <span className="text-gray-900 font-medium">
                {species.habitat}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Población: </span>
              <span className="text-gray-900 font-medium">
                {species.population}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
