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
};
