import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { api } from "./services/api";
import { useAuth } from "./context/auth-context";
import { Header } from "./app/components/header";
import { FilterBar, Filters } from "./app/components/filter-bar";
import { FavoritesView } from "./app/components/fav-view";
import { SpeciesCard, type Species } from "./app/components/species-card";
import { SpeciesModal } from "./app/components/species-modal";
import { Plus, Heart, LayoutGrid } from "lucide-react";
import { toast, Toaster } from "sonner";

const LIMIT = 50;

const kingdomMap: Record<string, "animal" | "planta" | "hongo"> = {
  animalia: "animal",
  plantae: "planta",
  fungi: "hongo",
};

const mapApiSpeciesToCard = (s: any): Species => {
  const kingdom = String(s.taxonomy?.kingdom ?? "").toLowerCase();

  return {
    id: Number(s.id),
    name: s.commonName ?? s.scientificName ?? "Sin nombre",
    scientificName: s.scientificName ?? "",
    status: String(s.iucnStatus ?? ""),
    habitat: s.habitat ?? "",
    region: Array.isArray(s.regions) ? s.regions.join(", ") : "",
    population:
      s.latestCensus?.population != null
        ? String(s.latestCensus.population)
        : "",
    imageUrl:
      Array.isArray(s.media) && s.media.length ? s.media[0].mediaUrl : "",
    taxonomyId: Number(s.taxonomyId ?? 0),
    category: kingdomMap[kingdom] ?? "animal",
  };
};

export default function App() {
  const { isAdmin, user } = useAuth();
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [activeCategory, setActiveCategory] = useState<
    "animal" | "planta" | "hongo"
  >("animal");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [favoriteSpecies, setFavoriteSpecies] = useState<Species[]>([]);
  const [view, setView] = useState<"all" | "favorites">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [speciesToEdit, setSpeciesToEdit] = useState<Species | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    habitat: "all",
    region: "all",
    orderName: "all",
    family: "all",
    genus: "all",
  });

  // callback ref: al montar/desmontar el sentinel actualiza sentinelEl,
  // lo que dispara el efecto del observer solo cuando es necesario
  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    setSentinelEl(node);
  }, []);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const loadingRef = useRef(false);

  const categoryToKingdom: Record<string, string> = {
    animal: "animalia",
    planta: "plantae",
    hongo: "fungi",
  };

  // Carga inicial y reset
  const resetAndLoad = useCallback(
    async (f: Filters, cat: string) => {
      setIsLoading(true);
      setPage(1);
      setAllSpecies([]);
      try {
        const speciesPromise = api.fetchSpecies({
          kingdom: categoryToKingdom[cat],
          orderName: f.orderName !== "all" ? f.orderName : undefined,
          family: f.family !== "all" ? f.family : undefined,
          genus: f.genus !== "all" ? f.genus : undefined,
          status: f.status !== "all" ? f.status : undefined,
          search: f.search.trim() || undefined,
          region: f.region !== "all" ? f.region : undefined,
          habitat: f.habitat !== "all" ? f.habitat : undefined,
          page: 1,
          limit: LIMIT,
        });

        const favoritesPromise = user
          ? api.getFavorites()
          : Promise.resolve([]);

        const [result, favsData] = await Promise.all([
          speciesPromise,
          favoritesPromise,
        ]);

        setAllSpecies(result.data);
        setTotal(result.total);
        setHasMore(result.data.length === LIMIT && result.total > LIMIT);

        if (user && !favsData.error && Array.isArray(favsData)) {
          setFavorites(new Set(favsData.map((f: any) => Number(f.id))));
          setFavoriteSpecies(favsData as Species[]);
        } else {
          setFavorites(new Set());
          setFavoriteSpecies([]);
        }
      } catch (e) {
        console.error(e);
        setFavorites(new Set());
        setFavoriteSpecies([]);
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  // Infinite scroll
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setIsLoadingMore(true);

    const nextPage = page + 1;
    try {
      const result = await api.fetchSpecies({
        kingdom: categoryToKingdom[activeCategory],
        orderName: filters.orderName !== "all" ? filters.orderName : undefined,
        family: filters.family !== "all" ? filters.family : undefined,
        genus: filters.genus !== "all" ? filters.genus : undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        search: filters.search.trim() || undefined,
        region: filters.region !== "all" ? filters.region : undefined,
        habitat: filters.habitat !== "all" ? filters.habitat : undefined,
        page: nextPage,
        limit: LIMIT,
      });

      setAllSpecies((prev) => [...prev, ...result.data]);
      setPage(nextPage);
      // hasMore: hay más si lo cargado hasta ahora es menor que el total
      setHasMore(nextPage * LIMIT < result.total);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  }, [hasMore, page, activeCategory, filters]);

  // Ref siempre apuntado a la última versión de loadMore.
  // Permite que el observer llame a la versión actualizada sin necesitar reconectarse.
  const loadMoreFnRef = useRef(loadMore);
  useEffect(() => {
    loadMoreFnRef.current = loadMore;
  }, [loadMore]);

  // IntersectionObserver: usa el viewport como root (root: null) para funcionar
  // tanto cuando <main> scrollea como cuando scrollea el window.
  // Se reactiva SOLO cuando el sentinel entra/sale del DOM → evita cascadas al paginar.
  useEffect(() => {
    if (!sentinelEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreFnRef.current();
      },
      {
        root: null,
        rootMargin: "0px 0px 400px 0px",
        threshold: 0,
      },
    );
    observer.observe(sentinelEl);
    return () => observer.disconnect();
  }, [sentinelEl]);

  // Post-load check: si el sentinel sigue visible después de cargar (pocos resultados),
  // dispara loadMore para rellenar el viewport sin que el usuario tenga que scrollear.
  useEffect(() => {
    if (isLoading || isLoadingMore || !hasMore || !sentinelEl) return;
    const rect = sentinelEl.getBoundingClientRect();
    if (rect.top < window.innerHeight + 400) {
      loadMoreFnRef.current();
    }
  }, [isLoading, isLoadingMore, hasMore, sentinelEl]);

  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    const delay = hasLoadedOnce.current ? 400 : 0;
    searchTimer.current = setTimeout(() => {
      resetAndLoad(filters, activeCategory);
      hasLoadedOnce.current = true;
    }, delay);
    return () => clearTimeout(searchTimer.current);
  }, [
    filters.search,
    filters.status,
    filters.region,
    filters.habitat,
    filters.orderName,
    filters.family,
    filters.genus,
    activeCategory,
    resetAndLoad,
    user,
  ]);

  // Vista favoritos o explorar
  const displaySpecies = useMemo(() => {
    return allSpecies.filter((s) => s.category === activeCategory);
  }, [allSpecies, activeCategory]);

  const favoriteSpeciesByCategory = useMemo(
    () => favoriteSpecies.filter((s) => s.category === activeCategory),
    [favoriteSpecies, activeCategory],
  );

  const handleCategoryChange = (cat: "animal" | "planta" | "hongo") => {
    setActiveCategory(cat);
    setView("all");
    setFilters({
      search: "",
      status: "all",
      habitat: "all",
      region: "all",
      orderName: "all",
      family: "all",
      genus: "all",
    });
  };

  const handleOpenCreate = () => {
    setSpeciesToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (species: Species) => {
    setSpeciesToEdit(species);
    setIsModalOpen(true);
  };

  const syncUpdatedSpecies = (updatedSpecies: any) => {
    if (!updatedSpecies?.id) {
      resetAndLoad(filters, activeCategory);
      return;
    }

    const mappedSpecies = mapApiSpeciesToCard(updatedSpecies);

    setAllSpecies((current) =>
      current.map((species) =>
        species.id === mappedSpecies.id ? mappedSpecies : species,
      ),
    );

    setFavoriteSpecies((current) =>
      current.map((species) =>
        species.id === mappedSpecies.id ? mappedSpecies : species,
      ),
    );

    resetAndLoad(filters, activeCategory);
  };

  const handleDelete = (id: number) => {
    toast("¿Eliminar esta especie?", {
      action: {
        label: "Eliminar",
        onClick: async () => {
          const res = await api.deleteSpecies(id);
          if (!res.error) {
            resetAndLoad(filters, activeCategory);
            toast.success("Especie eliminada correctamente");
          } else {
            toast.error("Error al eliminar la especie");
          }
        },
      },
      cancel: { label: "Cancelar", onClick: () => {} },
    });
  };

  const toggleFavorite = async (id: number) => {
    if (favorites.has(id)) {
      const res = await api.removeFavorite(id);
      if (!res.error) {
        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setFavoriteSpecies((prev) =>
          prev.filter((species) => species.id !== id),
        );
      }
    } else {
      const res = await api.addFavorite(id);
      if (!res.error) {
        setFavorites((prev) => new Set(prev).add(id));
        const addedSpecies = allSpecies.find((species) => species.id === id);
        if (addedSpecies) {
          setFavoriteSpecies((prev) => [...prev, addedSpecies]);
        }
      }
    }
  };

  return (
    <div className="size-full flex flex-col bg-gray-50">
      <Header
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />
      <FilterBar
        category={activeCategory}
        onFilterChange={setFilters}
        filters={filters}
      />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Barra Explorar / Favoritos */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 border-b pb-4">
            <div className="flex bg-white rounded-lg p-1 shadow-sm border">
              <button
                onClick={() => setView("all")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${view === "all" ? "bg-emerald-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}
              >
                <LayoutGrid size={18} /> Explorar
              </button>
              <button
                onClick={() => setView("favorites")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${view === "favorites" ? "bg-emerald-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}
              >
                <Heart
                  size={18}
                  className={view === "favorites" ? "fill-white" : ""}
                />
                Favoritos ({favorites.size})
              </button>
            </div>

            {!isLoading && (
              <span className="text-sm text-gray-500">
                {view === "favorites"
                  ? `${favoriteSpeciesByCategory.length} favoritos`
                  : `${displaySpecies.length} de ${total} especies`}
              </span>
            )}

            {isAdmin && (
              <button
                onClick={handleOpenCreate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <Plus size={20} /> Nueva Especie
              </button>
            )}
          </div>

          {/* Loading inicial */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white border animate-pulse h-72"
                />
              ))}
            </div>
          )}

          {/* Grilla de especies */}
          {!isLoading &&
            view === "favorites" &&
            favoriteSpeciesByCategory.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                <p className="text-gray-400 text-xl font-light">
                  No tenés favoritos en esta categoría.
                </p>
              </div>
            )}

          {!isLoading && view === "all" && displaySpecies.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
              <p className="text-gray-400 text-xl font-light">
                No se encontraron especies con estos filtros.
              </p>
            </div>
          )}

          {!isLoading &&
            view === "favorites" &&
            favoriteSpeciesByCategory.length > 0 && (
              <FavoritesView
                favorites={favoriteSpeciesByCategory}
                onToggleFavorite={toggleFavorite}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
              />
            )}

          {!isLoading && view === "all" && displaySpecies.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displaySpecies.map((s) => (
                  <SpeciesCard
                    key={s.id}
                    species={s}
                    isFavorite={favorites.has(s.id)}
                    onToggleFavorite={toggleFavorite}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              {/* Sentinel para infinite scroll */}
              <div ref={sentinelRef} className="h-10 mt-4" />

              {/* Spinner de "cargando más" */}
              {isLoadingMore && (
                <div className="flex justify-center py-6">
                  <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Fin de resultados */}
              {!hasMore && !isLoadingMore && displaySpecies.length > 0 && (
                <p className="text-center text-gray-400 text-sm py-6">
                  Mostrando todas las {total} especies
                </p>
              )}
            </>
          )}
        </div>
      </main>

      <SpeciesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={syncUpdatedSpecies}
        speciesToEdit={speciesToEdit}
        activeCategory={activeCategory}
      />
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
