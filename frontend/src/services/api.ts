const API_URL = "http://localhost:3000/api";

export const fetchSpecies = async () => {
  try {
    const response = await fetch(`${API_URL}/species`);
    if (!response.ok) throw new Error("Error al conectar con el servidor");
    return await response.json();
  } catch (error) {
    console.error("Error en fetchSpecies:", error);
    return [];
  }
};
