import { Species } from "../entities/species.entity";
import { ResponseDTO } from "../dto/species.dto";

export function SpeciesMapper(species: Species): ResponseDTO {
  const populationDisplay = species.populationOperator
    ? `${species.populationOperator} ${species.populationValue}`
    : `${species.populationValue}`;

  const riskLevelMap = {
    EX: 5,
    CR: 4,
    EN: 3,
    VU: 2,
    NT: 1,
    LC: 0,
  };

  const trendMap: Record<
    "aumento" | "descenso" | "estable" | "desconocido",
    "up" | "down" | "stable" | "unknown"
  > = {
    aumento: "up",
    descenso: "down",
    estable: "stable",
    desconocido: "unknown",
  };

  return {
    id: species.id,
    scientificName: species.scientificName,
    name: species.name,
    category: species.category,
    habitat: species.habitat,
    status: species.status,
    imageUrl: species.imageUrl,
    region: species.region?.map((r) => r.name) ?? [],
    populationDisplay,
    riskLevel: riskLevelMap[species.status],
    isCritical: ["EX", "CR", "EN", "VU"].includes(species.status),
    trendDirection: trendMap[species.currentTrend],
  };
}
