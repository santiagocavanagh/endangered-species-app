import { AppDataSource } from "../config/data.source";
import { Species } from "../entities/species.entity";
import { Region } from "../entities/region.entity";
import { PopulationCensus } from "../entities/population-census.entity";
import { Taxonomy } from "../entities/taxonomy.entity";
import { In } from "typeorm";
import { CreateDTO, UpdateDTO } from "../dto/species.dto";
import { SpeciesMedia, MediaType } from "../entities/species-media.entity";

export class SpeciesService {
  private speciesRepo = AppDataSource.getRepository(Species);
  private regionRepo = AppDataSource.getRepository(Region);
  private censusRepo = AppDataSource.getRepository(PopulationCensus);
  private taxonomyRepo = AppDataSource.getRepository(Taxonomy);

  // READ
  async getCritical() {
    // species with highest risk categories
    return this.speciesRepo.find({
      where: { iucnStatus: In(["EX", "CR", "EN", "VU"]) },
      relations: ["regions", "taxonomy"],
    });
  }

  async getRescued() {
    return this.speciesRepo.find({
      where: { iucnStatus: In(["NT", "LC"]) },
      relations: ["regions", "taxonomy"],
    });
  }

  async getAll() {
    return this.speciesRepo.find({
      relations: ["regions", "taxonomy", "media", "populationCensus"],
    });
  }

  async getOne(id: number) {
    return this.speciesRepo.findOne({
      where: { id },
      relations: [
        "regions",
        "populationCensus",
        "statusHistory",
        "media",
        "taxonomy",
      ],
    });
  }

  // CREATE
  async create(data: CreateDTO) {
    const regions = await this.regionRepo.findBy({
      id: In(data.regionIds),
    });

    const taxonomy: Taxonomy | null = await this.taxonomyRepo.findOneBy({
      id: data.taxonomyId,
    });
    if (!taxonomy) throw new Error("Taxonomy not found");

    const species = this.speciesRepo.create({
      scientificName: data.scientificName,
      commonName: data.commonName ?? null,
      iucnStatus: data.iucnStatus,
      taxonomy,
      taxonomyId: data.taxonomyId,
      description: data.description ?? null,
      habitat: data.habitat ?? null,
      regions: regions,
    });

    const saved = await this.speciesRepo.save(species);

    // optionally create an initial census record if population provided
    if (data.population !== undefined) {
      // accept censusDate as Date or ISO string, default to today
      let censusDateStr: string;
      if (data.censusDate) {
        if (typeof data.censusDate === "string") {
          const parsed = new Date(data.censusDate);
          if (isNaN(parsed.getTime())) throw new Error("Invalid censusDate");
          censusDateStr = parsed.toISOString().split("T")[0];
        } else if (data.censusDate instanceof Date) {
          censusDateStr = data.censusDate.toISOString().split("T")[0];
        } else {
          throw new Error("Invalid censusDate");
        }
      } else {
        censusDateStr = new Date().toISOString().split("T")[0];
      }

      await this.censusRepo.save({
        species: saved,
        censusDate: censusDateStr,
        population: data.population,
        source: data.sourceId ? ({ id: data.sourceId } as any) : null,
        notes: data.notes ?? null,
      });
    }

    // optionally create a media record for a provided imageUrl
    if ((data as any).imageUrl) {
      const mediaRepo = AppDataSource.getRepository(SpeciesMedia);
      await mediaRepo.save({
        species: saved,
        mediaUrl: (data as any).imageUrl,
        mediaType: MediaType.IMAGE,
        credit: null,
        license: null,
      } as any);
    }

    return saved;
  }

  // UPDATE
  async update(id: number, data: UpdateDTO) {
    const species = await this.speciesRepo.findOne({
      where: { id },
      relations: ["regions", "taxonomy"],
    });

    if (!species) throw new Error("Species not found");

    if (data.regionIds) {
      species.regions = await this.regionRepo.findBy({
        id: In(data.regionIds),
      });
    }

    Object.assign(species, {
      scientificName: data.scientificName ?? species.scientificName,
      commonName: data.commonName ?? species.commonName,
      iucnStatus: data.iucnStatus ?? species.iucnStatus,
      description: data.description ?? species.description,
      habitat: data.habitat ?? species.habitat,
    });

    if (data.taxonomyId) {
      const taxonomy: Taxonomy | null = await this.taxonomyRepo.findOneBy({
        id: data.taxonomyId,
      });
      if (!taxonomy) throw new Error("Taxonomy not found");
      species.taxonomy = taxonomy;
      species.taxonomyId = data.taxonomyId;
    }

    const updated = await this.speciesRepo.save(species);

    if (data.population !== undefined) {
      let censusDateStr: string;
      if (data.censusDate) {
        if (typeof data.censusDate === "string") {
          const parsed = new Date(data.censusDate);
          if (isNaN(parsed.getTime())) throw new Error("Invalid censusDate");
          censusDateStr = parsed.toISOString().split("T")[0];
        } else if (data.censusDate instanceof Date) {
          censusDateStr = data.censusDate.toISOString().split("T")[0];
        } else {
          throw new Error("Invalid censusDate");
        }
      } else {
        censusDateStr = new Date().toISOString().split("T")[0];
      }

      await this.censusRepo.save({
        species: updated,
        censusDate: censusDateStr,
        population: data.population,
        source: data.sourceId ? ({ id: data.sourceId } as any) : null,
        notes: data.notes ?? null,
      });
    }

    if ((data as any).imageUrl) {
      const mediaRepo = AppDataSource.getRepository(SpeciesMedia);
      await mediaRepo.save({
        species: updated,
        mediaUrl: (data as any).imageUrl,
        mediaType: MediaType.IMAGE,
        credit: null,
        license: null,
      } as any);
    }

    return updated;
  }

  // DELETE
  async delete(id: number) {
    await this.speciesRepo.delete(id);
  }
}
