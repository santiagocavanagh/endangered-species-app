import { Species } from "../entities/species.entity";
import { SpeciesDTO } from "../DTO/species.dto";

function toIsoDate(value: Date | string | null | undefined): string {
  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return String(value);
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

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
      populationDisplay: latest.populationDisplay ?? null,
      date:
        latest.censusDate instanceof Date
          ? latest.censusDate.toISOString().split("T")[0]
          : String(latest.censusDate),
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

    statusHistory:
      species.statusHistory?.map((h) => ({
        oldStatus: h.oldStatus,
        newStatus: h.newStatus,
        changedAt: String(h.changedAt),
      })) ?? [],

    externalRefs:
      species.externalRefs?.map((ref) => ({
        id: ref.id,
        provider: ref.provider,
        externalId: ref.externalId,
        matchedName: ref.matchedName,
        confidence: toNullableNumber(ref.confidence),
        matchStatus: ref.matchStatus,
        meta: ref.meta,
        updatedAt: toIsoDate(ref.updatedAt),
      })) ?? [],
  };
}
