import { useEffect, useState, useMemo } from "react";
import { api } from "./services/api";
import { Header } from "./app/components/header";
import { FilterBar, Filters } from "./app/components/FilterBar";
import { SpeciesCard, type Species } from "./app/components/species-card";

export default function App() {
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [activeCategory, setActiveCategory] = useState<"animal" | "planta" | "hongo">("animal");
  
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    habitat: "all",
    region: "all",
  });

  useEffect(() => {
    const loadData = async () => {
      const data = await api.fetchSpecies();
      setAllSpecies(data);
    };
    loadData();
  }, []);

  const toggleFavorite = (id: number) => {
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
    return allSpecies.filter((species) => {
      if (species.category !== activeCategory) return false;

      if (
        filters.search &&
        !species.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !species.scientificName.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      if (filters.status !== "all" && species.status !== filters.status) {
        return false;
      }

      if (
        filters.habitat !== "all" &&
        !species.habitat.toLowerCase().includes(filters.habitat.toLowerCase())
      ) {
        return false;
      }

      if (filters.region !== "all") {
        const speciesRegion = species.region
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    
        const filterRegion = filters.region
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

        if (!speciesRegion.includes(filterRegion)) {
          return false;
        }
      }

      return true;
    });
  }, [allSpecies, activeCategory, filters]);

  return (
    <div className="size-full flex flex-col bg-gray-50">
      <Header
        activeCategory={activeCategory}
        onCategoryChange={(category) => {
          setActiveCategory(category as "animal" | "planta" | "hongo");
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
                Sin Resultados para èsta Bùsqueda.
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