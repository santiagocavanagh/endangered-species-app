import { ENV } from "../config/env.config";

export const obtenerDatosIUCN = async () => {
  const iucntoken = ENV.IUCN_TOKEN;
  const url = "https://api.iucnredlist.org/api/v4/biogeographical_realms/";

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: iucntoken, // o 'Bearer ' + token
      },
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("Error al extraer datos:", error);
  }
};
