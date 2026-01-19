import { useEffect, useState, useMemo, useCallback } from "react";
import { api } from "./services/api";
import { Header } from "./app/components/header";
import { FilterBar, Filters } from "./app/components/Filter-bar";
import { SpeciesCard, type Species } from "./app/components/species-card";
import { SpeciesModal } from "./app/components/species-modal";
import { useAuth } from "./context/AuthContext";
import { Plus, Heart, LayoutGrid } from "lucide-react";

export default function App() {
  const { isAdmin } = useAuth();
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [activeCategory, setActiveCategory] = useState<"animal" | "planta" | "hongo">("animal");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [view, setView] = useState<"all" | "favorites">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [speciesToEdit, setSpeciesToEdit] = useState<Species | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    habitat: "all",
    region: "all",
  });

  const loadData = useCallback(async () => {
    try {
      const speciesData = await api.fetchSpecies();
      setAllSpecies(speciesData);

      const favsData = await api.getFavorites();
      if (!favsData.error && Array.isArray(favsData)) {
        const favIds = new Set<number>(favsData.map((f: any) => Number(f.speciesId || f.id)));
        setFavorites(favIds);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setSpeciesToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (species: Species) => {
    setSpeciesToEdit(species);
    setIsModalOpen(true);
  };

  const toggleFavorite = async (id: number) => {
    if (favorites.has(id)) {
      const res = await api.removeFavorite(id);
      if (!res.error) {
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } else {
      const res = await api.addFavorite(id);
      if (!res.error) {
        setFavorites(prev => new Set(prev).add(id));
      }
    }
  };

const baseSpecies = useMemo(() => {
  if (view === "favorites") {
    return allSpecies.filter(s => favorites.has(s.id));
  }
  return allSpecies;
}, [allSpecies, favorites, view]);

const displaySpecies = useMemo(() => {
  return baseSpecies.filter((species) => {
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
    } if (
      filters.habitat !== "all" &&
      !species.habitat.toLowerCase().includes(filters.habitat.toLowerCase())
    ) {
      return false;
    }
      if (filters.region !== "all") {
      const speciesRegion = species.region.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const filterRegion = filters.region.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (!speciesRegion.includes(filterRegion)) return false;
    }
      return true;
  });
}, [baseSpecies, activeCategory, filters]);


const favoriteSpeciesList = useMemo(() => {
  return allSpecies.filter(s => favorites.has(s.id));
}, [allSpecies, favorites]);

  return (
    <div className="size-full flex flex-col bg-gray-50">
      <Header
        activeCategory={activeCategory}
        onCategoryChange={(category) => {
          setActiveCategory(category as "animal" | "planta" | "hongo");
          setView("all");
        }}
      />
      
      <FilterBar
        category={activeCategory}
        onFilterChange={setFilters}
        filters={filters}
      />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 border-b pb-4">
            <div className="flex bg-white rounded-lg p-1 shadow-sm border">
              <button 
                onClick={() => setView("all")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${view === 'all' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <LayoutGrid size={18} /> Explorar
              </button>
              <button 
                onClick={() => setView("favorites")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${view === 'favorites' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Heart size={18} className={view === 'favorites' ? 'fill-white' : ''} /> Favoritos ({favorites.size})
              </button>
            </div>

            {isAdmin && (
              <button 
                onClick={handleOpenCreate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <Plus size={20} /> Nueva Especie
              </button>
            )}
          </div>
          {displaySpecies.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
              {view === "favorites" ? (
                <>
                  <Heart size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 text-xl font-light">
                    No tienes favoritos en esta categoría o filtro.
                  </p>
                </>
              ) : (
                <p className="text-gray-400 text-xl font-light">
                  No se encontraron especies con estos filtros.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displaySpecies.map((s) => (
                <SpeciesCard
                  key={s.id}
                  species={s}
                  isFavorite={favorites.has(s.id)}
                  onToggleFavorite={toggleFavorite}
                  onEdit={handleOpenEdit}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <SpeciesModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
        speciesToEdit={speciesToEdit}
        activeCategory={activeCategory}
      />
    </div>
  );
}