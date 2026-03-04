import { Species } from "../entities/species.entity";
import { ResponseDTO } from "../dto/species.dto";

export function SpeciesMapper(species: Species): ResponseDTO {
  let latestPop: number | undefined;
  let latestDate: string | undefined;
  let latestSource: { id: number; name: string } | undefined;

  if (species.populationCensus && species.populationCensus.length) {
    const sorted = [...species.populationCensus].sort(
      (a, b) => b.censusDate.getTime() - a.censusDate.getTime(),
    );
    const latest = sorted[0];

    latestPop = latest.population;
    latestDate = latest.censusDate.toISOString().split("T")[0];

    if (latest.source) {
      latestSource = {
        id: latest.source.id,
        name: latest.source.name,
      };
    }
  }

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

    latestPopulation: latestPop,
    latestCensusDate: latestDate,
    source: latestSource,

    media: species.media?.map((m) => ({
      mediaUrl: m.mediaUrl,
      mediaType: m.mediaType,
      credit: m.credit,
      license: m.license,
    })),
  };
}
