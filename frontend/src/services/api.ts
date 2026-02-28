const API_URL = "http://localhost:3000/api";

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  fetchSpecies: async (): Promise<any[]> => {
    try {
      const response = await fetch(`${API_URL}/species`);
      if (!response.ok) throw new Error("Error en el servidor");
      const list = await response.json();

      // Map backend ResponseDTO -> frontend Species shape
      return list.map((s: any) => ({
        id: Number(s.id),
        name: s.name ?? s.commonName ?? "",
        scientificName: s.scientificName ?? "",
        status: s.iucnStatus ?? s.status ?? "",
        habitat: s.habitat ?? "",
        // join regions into single string for UI
        region: Array.isArray(s.regions)
          ? s.regions.join(", ")
          : s.region || "",
        population:
          s.latestPopulation !== undefined && s.latestPopulation !== null
            ? String(s.latestPopulation)
            : "",
        imageUrl:
          Array.isArray(s.media) && s.media.length ? s.media[0].mediaUrl : "",
        // frontend used `category` mapped from backend taxonomy (kingdom)
        category: s.taxonomy?.kingdom
          ? String(s.taxonomy.kingdom).toLowerCase()
          : "animal",
        // keep raw backend object for advanced UI if needed
        _raw: s,
      }));
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  createSpecies: async (data: any): Promise<any> => {
    try {
      // map frontend form -> backend CreateDTO
      const taxonomies = await api.getTaxonomies();
      const regions = await api.getRegions();

      const category = (data.category || "").toLowerCase();
      const taxonomy =
        taxonomies.find(
          (t: any) => String(t.kingdom).toLowerCase() === category,
        ) || taxonomies[0];
      const taxonomyId = taxonomy ? taxonomy.id : undefined;

      // support multiple regions comma-separated
      const regionNames = (data.region || "")
        .split(",")
        .map((r: string) => r.trim())
        .filter(Boolean);
      const regionIds = regionNames
        .map((name: string) => {
          const found = regions.find(
            (rg: any) => String(rg.name).toLowerCase() === name.toLowerCase(),
          );
          return found ? found.id : undefined;
        })
        .filter((id: any) => id !== undefined);

      const payload: any = {
        scientificName: data.scientificName,
        commonName: data.name || undefined,
        iucnStatus: data.status,
        taxonomyId: taxonomyId,
        description: data.description || undefined,
        habitat: data.habitat || undefined,
        regionIds: regionIds,
      };

      if (data.population) {
        const parsed = parseInt(
          String(data.population).replace(/[^0-9]/g, ""),
          10,
        );
        if (!isNaN(parsed)) {
          payload.population = parsed;
          payload.censusDate = new Date().toISOString().split("T")[0];
        }
      }

      // include imageUrl so backend service can create SpeciesMedia
      if (data.imageUrl) payload.imageUrl = data.imageUrl;

      const res = await fetch(`${API_URL}/species`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (error) {
      console.error(error);
      return { error: "No se pudo crear" };
    }
  },

  updateSpecies: async (id: number, data: any): Promise<any> => {
    try {
      // perform same mapping as create
      const taxonomies = await api.getTaxonomies();
      const regions = await api.getRegions();

      const category = (data.category || "").toLowerCase();
      const taxonomy =
        taxonomies.find(
          (t: any) => String(t.kingdom).toLowerCase() === category,
        ) || taxonomies[0];
      const taxonomyId = taxonomy ? taxonomy.id : undefined;

      const regionNames = (data.region || "")
        .split(",")
        .map((r: string) => r.trim())
        .filter(Boolean);
      const regionIds = regionNames
        .map((name: string) => {
          const found = regions.find(
            (rg: any) => String(rg.name).toLowerCase() === name.toLowerCase(),
          );
          return found ? found.id : undefined;
        })
        .filter((id: any) => id !== undefined);

      const payload: any = {
        scientificName: data.scientificName,
        commonName: data.name || undefined,
        iucnStatus: data.status,
        taxonomyId: taxonomyId,
        description: data.description || undefined,
        habitat: data.habitat || undefined,
        regionIds: regionIds.length ? regionIds : undefined,
      };

      if (data.population) {
        const parsed = parseInt(
          String(data.population).replace(/[^0-9]/g, ""),
          10,
        );
        if (!isNaN(parsed)) {
          payload.population = parsed;
          payload.censusDate = new Date().toISOString().split("T")[0];
        }
      }

      if (data.imageUrl) payload.imageUrl = data.imageUrl;

      const res = await fetch(`${API_URL}/species/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (error) {
      console.error(error);
      return { error: "No se pudo actualizar" };
    }
  },

  deleteSpecies: async (id: number): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/species/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (error) {
      console.error(error);
      return { error: "No se pudo eliminar" };
    }
  },

  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) throw new Error("Credenciales incorrectas");
      return await res.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  register: async (payload: {
    email: string;
    password: string;
    name?: string;
    role?: string;
  }) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  getTaxonomies: async () => {
    try {
      const res = await fetch(`${API_URL}/taxonomies`);
      if (!res.ok) throw new Error("Error fetching taxonomies");
      return await res.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  },

  getRegions: async () => {
    try {
      const res = await fetch(`${API_URL}/regions`);
      if (!res.ok) throw new Error("Error fetching regions");
      return await res.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  },

  updateProfile: async (data: { name?: string; password?: string }) => {
    const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };

    const response = await fetch(`${API_URL}/auth/update-profile`, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Error al actualizar el perfil");
    }

    return result;
  },

  getFavorites: async (): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/favorites`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (error) {
      return { error: "No se pudieron cargar favoritos" };
    }
  },

  addFavorite: async (speciesId: number): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/favorites/${speciesId}`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (error) {
      return { error: "No se pudo agregar a favoritos" };
    }
  },

  removeFavorite: async (speciesId: number): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/favorites/${speciesId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (error) {
      return { error: "No se pudo quitar de favoritos" };
    }
  },
};
