import type { Species } from "../app/components/species-card";

export interface SpeciesDistribution {
  speciesId: number;
  scientificName: string;
  provider: string | null;
  matchStatus: string | null;
  externalId: string | null;
  hasData: boolean;
  occurrenceCount: number | null;
  tileUrlTemplate: string | null;
  attribution: string | null;
  lastValidatedAt: string | null;
  reason: string | null;
}

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

const parseApiResponse = async (response: Response) => {
  const body = await response.json().catch(() => null);
  if (response.ok) {
    return body;
  }
  const message = body?.error ?? body?.message ?? "Error en el servidor";
  return {
    error: typeof message === "string" ? message : JSON.stringify(message),
  };
};

const categoryToKingdom: Record<string, string> = {
  animal: "animalia",
  planta: "plantae",
  hongo: "fungi",
};

const parsePopulationValue = (raw: unknown): number | undefined => {
  if (raw === undefined || raw === null) {
    return undefined;
  }

  const text = String(raw).trim();
  if (!text) {
    return undefined;
  }

  const normalized = text.replace(/,/g, "").replace(/[^0-9~]/g, "~");
  const parts = normalized.split("~").filter(Boolean);
  const numbers = parts
    .map((part) => Number(part))
    .filter((value) => Number.isFinite(value));

  if (numbers.length === 0) {
    return undefined;
  }

  if (normalized.startsWith("~") && numbers.length === 1) {
    return numbers[0];
  }

  if (numbers.length >= 2) {
    return Math.round((numbers[0] + numbers[1]) / 2);
  }

  return numbers[0];
};

const FALLBACK_IMAGES: Record<string, string> = {
  animalia: "/animalae.png",
  plantae: "/plantae.png",
  fungi: "/fungi.png",
};

const mapSpeciesToClient = (s: any): Species => {
  const k = String(s.taxonomy?.kingdom ?? "").toLowerCase();
  const rawImageUrl =
    Array.isArray(s.media) && s.media.length ? s.media[0].mediaUrl : "";
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
    imageUrl: rawImageUrl || FALLBACK_IMAGES[k] || "/animalae.png",
    taxonomyId: Number(s.taxonomyId ?? 0),
    category: kingdomMap[k] ?? "animal",
  };
};

const kingdomMap: Record<string, "animal" | "planta" | "hongo"> = {
  animalia: "animal",
  plantae: "planta",
  fungi: "hongo",
};

export const api = {
  fetchSpecies: async (
    params: {
      kingdom?: string;
      orderName?: string;
      family?: string;
      genus?: string;
      status?: string;
      search?: string;
      region?: string;
      habitat?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ data: any[]; total: number }> => {
    try {
      const qp = new URLSearchParams({
        limit: String(params.limit ?? 50),
        page: String(params.page ?? 1),
      });
      if (params.kingdom) qp.append("taxonomy", params.kingdom);
      if (params.orderName) qp.append("orderName", params.orderName);
      if (params.family) qp.append("family", params.family);
      if (params.genus) qp.append("genus", params.genus);
      if (params.status) qp.append("status", params.status);
      if (params.search) qp.append("search", params.search);
      if (params.region) qp.append("region", params.region);
      if (params.habitat) qp.append("habitat", params.habitat);

      const response = await fetch(`${API_URL}/species?${qp}`);
      if (!response.ok) throw new Error("Error en el servidor");

      const result = await response.json();
      const list = (result.data ?? []) as any[];

      const mapped = list.map(mapSpeciesToClient);

      return {
        data: mapped,
        total: result.meta?.total ?? mapped.length,
      };
    } catch (error) {
      console.error(error);
      return { data: [], total: 0 };
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

      const rawPopulation = String(data.population ?? "").trim();
      if (rawPopulation) {
        payload.populationDisplay = rawPopulation;
      }

      const population = parsePopulationValue(data.population);
      if (population !== undefined) {
        payload.population = population;
        payload.censusDate = new Date().toISOString().split("T")[0];
      }

      const res = await fetch(`${API_URL}/species`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await parseApiResponse(res);
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

      const population = parsePopulationValue(data.population);
      if (population !== undefined) {
        payload.population = population;
        payload.censusDate = new Date().toISOString().split("T")[0];
      }

      const res = await fetch(`${API_URL}/species/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await parseApiResponse(res);
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
      return await parseApiResponse(res);
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
      const data = await res.json();
      if (!res.ok) {
        return { error: data?.error ?? "No se pudieron cargar favoritos" };
      }
      if (!Array.isArray(data)) {
        return { error: "Respuesta de favoritos inválida" };
      }
      return data.map(mapSpeciesToClient);
    } catch (error) {
      console.error(error);
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

  fetchSpeciesById: async (id: number): Promise<any | null> => {
    try {
      const res = await fetch(`${API_URL}/species/${id}`);
      if (!res.ok) throw new Error("Not found");
      return await res.json();
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  fetchSpeciesDistribution: async (
    id: number,
  ): Promise<SpeciesDistribution | null> => {
    try {
      const res = await fetch(`${API_URL}/external/species/${id}/distribution`);
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  fetchSimilarSpecies: async (params: {
    kingdom: string;
    genus?: string | null;
    family?: string | null;
    excludeId: number;
    limit?: number;
  }): Promise<Species[]> => {
    try {
      const take = (params.limit ?? 6) + 2;
      const qp = new URLSearchParams({ limit: String(take), page: "1" });
      qp.append("taxonomy", params.kingdom);
      if (params.genus) qp.append("genus", params.genus);
      else if (params.family) qp.append("family", params.family);

      const res = await fetch(`${API_URL}/species?${qp}`);
      if (!res.ok) throw new Error("Error");
      const result = await res.json();
      const list = (result.data ?? []) as any[];
      return list
        .map(mapSpeciesToClient)
        .filter((s) => s.id !== params.excludeId)
        .slice(0, params.limit ?? 6);
    } catch {
      return [];
    }
  },
};
