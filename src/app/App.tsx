import { useState, useMemo } from "react";
import { Header } from "./components/Header";
import { FilterBar, Filters } from "./components/FilterBar";
import { SpeciesCard } from "./components/SpeciesCard";
import { speciesData } from "./data/speciesData";

export default function App() {
  const [activeCategory, setActiveCategory] = useState<"animal" | "planta" | "hongo">("animal");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    habitat: "all",
    region: "all",
  });

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  const filteredSpecies = useMemo(() => {
    return speciesData.filter((species) => {
      // Filtrar por categoría
      if (species.category !== activeCategory) return false;

      // Filtrar por búsqueda
      if (
        filters.search &&
        !species.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !species.scientificName.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // Filtrar por estado
      if (filters.status !== "all" && species.status !== filters.status) {
        return false;
      }

      // Filtrar por hábitat
      if (
        filters.habitat !== "all" &&
        !species.habitat.toLowerCase().includes(filters.habitat.toLowerCase())
      ) {
        return false;
      }

      // Filtrar por región
      if (
        filters.region !== "all" &&
        !species.region.toLowerCase().includes(filters.region.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [activeCategory, filters]);

  return (
    <div className="size-full flex flex-col bg-gray-50">
      <Header
        activeCategory={activeCategory}
        onCategoryChange={(category) => {
          setActiveCategory(category);
          // Resetear filtros al cambiar de categoría
          setFilters({
            search: "",
            status: "all",
            habitat: "all",
            region: "all",
          });
        }}
      />
      <FilterBar
        category={activeCategory}
        onFilterChange={setFilters}
        filters={filters}
      />
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {filteredSpecies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No se encontraron especies con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpecies.map((species) => (
                <SpeciesCard
                  key={species.id}
                  species={species}
                  isFavorite={favorites.has(species.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}