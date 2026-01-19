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
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  createSpecies: async (data: any): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/species`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (error) {
      console.error(error);
      return { error: "No se pudo crear" };
    }
  },

  updateSpecies: async (id: number, data: any): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/species/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
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

  updateProfile: async (data: { name?: string; password?: string }) => {
    const token = localStorage.getItem("token"); // Recuperamos el token del login

    const response = await fetch(
      "http://localhost:3000/api/auth/update-profile",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Aquí enviamos el token al middleware
        },
        body: JSON.stringify(data),
      },
    );

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
