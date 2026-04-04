import { Species } from "../entities/species.entity";
import { SpeciesDTO } from "../DTO/species.dto";

export function SpeciesMapper(species: Species): SpeciesDTO {
  const latest = species.populationCensus?.length
    ? species.populationCensus.reduce((prev, curr) =>
        curr.censusDate > prev.censusDate ? curr : prev,
      )
    : undefined;

  return {
    id: species.id,
    scientificName: species.scientificName,
    commonName: species.commonName,
    iucnStatus: species.iucnStatus,
    taxonomyId: species.taxonomyId,

    taxonomy: species.taxonomy && {
      kingdom: species.taxonomy.kingdom,
      phylum: species.taxonomy.phylum,
      className: species.taxonomy.className,
      orderName: species.taxonomy.orderName,
      family: species.taxonomy.family,
      genus: species.taxonomy.genus,
    },

    description: species.description,
    habitat: species.habitat,

    regions: species.regions?.map((r) => r.name) ?? [],

    latestCensus: latest && {
      population: latest.population,
      date: latest.censusDate.toISOString(),
      source: latest.source && {
        id: latest.source.id,
        name: latest.source.name,
      },
    },

    media:
      species.media?.map((m) => ({
        mediaUrl: m.mediaUrl,
        mediaType: m.mediaType,
        credit: m.credit,
        license: m.license,
      })) ?? [],
  };
}
