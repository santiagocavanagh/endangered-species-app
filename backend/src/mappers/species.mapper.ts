import { Species } from "../entities/species.entity";
import { ResponseDTO } from "../dto/species.dto";

export function SpeciesMapper(species: Species): ResponseDTO {
  const latest = species.populationCensus?.[0];

  return {
    id: species.id,
    scientificName: species.scientificName,
    commonName: species.commonName,
    iucnStatus: species.iucnStatus,
    taxonomyId: species.taxonomyId,

    taxonomy: species.taxonomy
      ? {
          kingdom: species.taxonomy.kingdom,
          phylum: species.taxonomy.phylum,
          class_name: species.taxonomy.className,
          order_name: species.taxonomy.orderName,
          family: species.taxonomy.family,
          genus: species.taxonomy.genus,
        }
      : undefined,

    description: species.description,
    habitat: species.habitat,

    regions: species.regions?.map((r) => r.name) ?? [],

    latestPopulation: latest?.population,

    latestCensus: latest
      ? {
          population: latest.population,
          date: latest.censusDate.toISOString().split("T")[0],
          source: latest.source
            ? {
                id: latest.source.id,
                name: latest.source.name,
              }
            : undefined,
        }
      : undefined,

    media:
      species.media?.map((m) => ({
        mediaUrl: m.mediaUrl,
        mediaType: m.mediaType,
        credit: m.credit,
        license: m.license,
      })) ?? [],
  };
}
