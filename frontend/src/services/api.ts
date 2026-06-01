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

const categoryToKingdom: Record<string, string> = {
  animal: "animalia",
  planta: "plantae",
  hongo: "fungi",
};

const kingdomMap: Record<string, "animal" | "planta" | "hongo"> = {
  animalia: "animal",
  plantae: "planta",
  fungi: "hongo",
};

export const api = {
  fetchSpecies: async (): Promise<any[]> => {
    try {
      const response = await fetch(`${API_URL}/species`);
      if (!response.ok) throw new Error("Error en el servidor");

      const result = await response.json();
      const list = result.data ?? result;

      return list.map((s: any) => {
        const kingdom = String(s.taxonomy?.kingdom ?? "").toLowerCase();
        return {
          id: Number(s.id),
          name: s.name ?? s.commonName ?? "",
          scientificName: s.scientificName ?? "",
          status: s.iucnStatus ?? s.status ?? "",
          habitat: s.habitat ?? "",
          taxonomyId: Number(s.taxonomyId),
          region: Array.isArray(s.regions)
            ? s.regions.join(", ")
            : s.region || "",
          population:
            s.latestPopulation !== undefined && s.latestPopulation !== null
              ? String(s.latestPopulation)
              : "",
          imageUrl:
            Array.isArray(s.media) && s.media.length ? s.media[0].mediaUrl : "",
          category: kingdomMap[kingdom] ?? "animal",
          _raw: s,
        };
      });
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  createSpecies: async (data: any): Promise<any> => {
    try {
      const taxonomies = await api.getTaxonomies();
      const regions = await api.getRegions();

      const category = (data.category || "").toLowerCase();
      const kingdomSearch = categoryToKingdom[category] ?? category;

      const taxonomy =
        taxonomies.find(
          (t: any) => String(t.kingdom).toLowerCase() === kingdomSearch,
        ) || taxonomies[0];

      const taxonomyId: number | undefined =
        data.taxonomyId ?? (taxonomy ? taxonomy.id : undefined);

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
        description: data.description || undefined,
        habitat: data.habitat || undefined,
        taxonomyId,
        regionIds,
      };

      if (data.imageUrl) payload.imageUrl = data.imageUrl;

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
      const taxonomies = await api.getTaxonomies();
      const regions = await api.getRegions();

      const category = (data.category || "").toLowerCase();
      const kingdomSearch = categoryToKingdom[category] ?? category;

      const taxonomy =
        taxonomies.find(
          (t: any) => String(t.kingdom).toLowerCase() === kingdomSearch,
        ) || taxonomies[0];

      const taxonomyId: number | undefined =
        data.taxonomyId ?? (taxonomy ? taxonomy.id : undefined);

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
        taxonomyId,
        description: data.description || undefined,
        habitat: data.habitat || undefined,
        regionIds: regionIds.length ? regionIds : undefined,
      };

      if (data.imageUrl) payload.imageUrl = data.imageUrl;

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

      const res = await fetch(`${API_URL}/species/${id}`, {
        method: "PATCH",
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
      if (res.status === 204) return { success: true };
      return await res.json();
    } catch (error) {
      return { error: "No se pudo eliminar" };
    }
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
