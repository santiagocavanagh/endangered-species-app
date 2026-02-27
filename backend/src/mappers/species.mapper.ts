import { Species } from "../entities/species.entity";
import { ResponseDTO } from "../dto/species.dto";

export function SpeciesMapper(species: Species): ResponseDTO {
  // determine most recent census if available
  let latestPop: number | undefined;
  let latestDate: string | undefined;
  if (species.populationCensus && species.populationCensus.length) {
    const sorted = [...species.populationCensus].sort((a, b) =>
      b.censusDate.localeCompare(a.censusDate),
    );
    latestPop = sorted[0].population;
    latestDate = sorted[0].censusDate as unknown as string;
  }

  return {
    id: species.id,
    scientificName: species.scientificName,
    name: species.commonName,
    commonName: species.commonName,
    iucnStatus: species.iucnStatus,
    status: species.iucnStatus,
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
    media: species.media?.map((m) => ({
      mediaUrl: m.mediaUrl,
      mediaType: m.mediaType,
      credit: m.credit,
      license: m.license,
    })),
  };
}
