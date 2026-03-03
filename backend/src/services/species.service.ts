import { AppDataSource } from "../config/data.source";
import { Species } from "../entities/species.entity";
import { Region } from "../entities/region.entity";
import { PopulationCensus } from "../entities/population-census.entity";
import { Taxonomy } from "../entities/taxonomy.entity";
import {
  DataSource as DataSourceEntity,
  DataSourceType,
} from "../entities/data-source.entity";
import * as fs from "fs";
import * as path from "path";
import { In } from "typeorm";
import { CreateDTO, UpdateDTO } from "../dto/species.dto";
import { SpeciesMedia, MediaType } from "../entities/species-media.entity";

const REPORTS_DIR = path.resolve(process.cwd(), "..", "REPORTES");
fs.mkdirSync(REPORTS_DIR, { recursive: true });

export class SpeciesService {
  private speciesRepo = AppDataSource.getRepository(Species);
  private regionRepo = AppDataSource.getRepository(Region);
  private censusRepo = AppDataSource.getRepository(PopulationCensus);
  private taxonomyRepo = AppDataSource.getRepository(Taxonomy);

  async getCritical() {
    return this.speciesRepo.find({
      where: { iucnStatus: In(["CR", "EN", "VU"]) },
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

  async create(data: CreateDTO) {
    const regions = await this.regionRepo.findBy({ id: In(data.regionIds) });
    const taxonomy = await this.taxonomyRepo.findOneBy({ id: data.taxonomyId });
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

    let savedSpecies: Species;

    await AppDataSource.manager.transaction(async (manager) => {
      const speciesRepoTx = manager.getRepository(Species);
      const censusRepoTx = manager.getRepository(PopulationCensus);
      const mediaRepoTx = manager.getRepository(SpeciesMedia);
      const dataSourceRepoTx = manager.getRepository(DataSourceEntity);

      savedSpecies = await speciesRepoTx.save(species);

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

        let sourceEntity: any = null;
        if (data.sourceId) {
          sourceEntity = await dataSourceRepoTx.findOneBy({
            id: data.sourceId,
          });
        }
        if (!sourceEntity) {
          sourceEntity = await dataSourceRepoTx.findOneBy({
            name: "user-submitted",
          });
          if (!sourceEntity) {
            sourceEntity = dataSourceRepoTx.create({
              name: "user-submitted",
              url: null,
              type: DataSourceType.OTHER,
            } as any);
            sourceEntity = await dataSourceRepoTx.save(sourceEntity as any);
          }
        }

        await censusRepoTx.save({
          species: savedSpecies,
          censusDate: censusDateStr,
          population: data.population,
          source: sourceEntity,
          notes: data.notes ?? null,
        } as any);
        try {
          fs.appendFileSync(
            path.join(REPORTS_DIR, "backend_actions.log"),
            `Census saved for species ${savedSpecies.id} source ${sourceEntity.id}\n`,
          );
        } catch (w) {
          console.error("Failed to write backend_actions log", w);
        }
      }

      if ((data as any).imageUrl) {
        await mediaRepoTx.save({
          species: savedSpecies,
          mediaUrl: (data as any).imageUrl,
          mediaType: MediaType.IMAGE,
          credit: null,
          license: null,
        } as any);
        try {
          fs.appendFileSync(
            path.join(REPORTS_DIR, "backend_actions.log"),
            `Media saved for species ${savedSpecies.id} url ${(data as any).imageUrl}\n`,
          );
        } catch (w) {
          console.error("Failed to write backend_actions log", w);
        }
      }
    });

    return this.speciesRepo.findOne({
      where: { id: savedSpecies!.id },
      relations: ["regions", "taxonomy", "media", "populationCensus"],
    });
  }

  async update(id: number, data: UpdateDTO) {
    const species = await this.speciesRepo.findOne({
      where: { id },
      relations: ["regions", "taxonomy"],
    });
    if (!species) throw new Error("Species not found");

    if (data.regionIds)
      species.regions = await this.regionRepo.findBy({
        id: In(data.regionIds),
      });

    Object.assign(species, {
      scientificName: data.scientificName ?? species.scientificName,
      commonName: data.commonName ?? species.commonName,
      iucnStatus: data.iucnStatus ?? species.iucnStatus,
      description: data.description ?? species.description,
      habitat: data.habitat ?? species.habitat,
    });

    if (data.taxonomyId) {
      const taxonomy = await this.taxonomyRepo.findOneBy({
        id: data.taxonomyId,
      });
      if (!taxonomy) throw new Error("Taxonomy not found");
      species.taxonomy = taxonomy;
      species.taxonomyId = data.taxonomyId;
    }

    let updatedSpecies: Species;
    await AppDataSource.manager.transaction(async (manager) => {
      const speciesRepoTx = manager.getRepository(Species);
      const censusRepoTx = manager.getRepository(PopulationCensus);
      const mediaRepoTx = manager.getRepository(SpeciesMedia);
      const dataSourceRepoTx = manager.getRepository(DataSourceEntity);

      updatedSpecies = await speciesRepoTx.save(species);

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

        let sourceEntity: any = null;
        if (data.sourceId)
          sourceEntity = await dataSourceRepoTx.findOneBy({
            id: data.sourceId,
          });
        if (!sourceEntity) {
          sourceEntity = await dataSourceRepoTx.findOneBy({
            name: "user-submitted",
          });
          if (!sourceEntity) {
            sourceEntity = dataSourceRepoTx.create({
              name: "user-submitted",
              url: null,
              type: DataSourceType.OTHER,
            } as any);
            sourceEntity = await dataSourceRepoTx.save(sourceEntity as any);
          }
        }

        await censusRepoTx.save({
          species: updatedSpecies,
          censusDate: censusDateStr,
          population: data.population,
          source: sourceEntity,
          notes: data.notes ?? null,
        } as any);
        try {
          fs.appendFileSync(
            path.join(REPORTS_DIR, "backend_actions.log"),
            `Census saved (update) for species ${updatedSpecies.id} source ${sourceEntity.id}\n`,
          );
        } catch (w) {
          console.error("Failed to write backend_actions log", w);
        }
      }

      if ((data as any).imageUrl) {
        await mediaRepoTx.save({
          species: updatedSpecies,
          mediaUrl: (data as any).imageUrl,
          mediaType: MediaType.IMAGE,
          credit: null,
          license: null,
        } as any);
        try {
          fs.appendFileSync(
            path.join(REPORTS_DIR, "backend_actions.log"),
            `Media saved (update) for species ${updatedSpecies.id} url ${(data as any).imageUrl}\n`,
          );
        } catch (w) {
          console.error("Failed to write backend_actions log", w);
        }
      }
    });

    return this.speciesRepo.findOne({
      where: { id: updatedSpecies!.id },
      relations: ["regions", "taxonomy", "media", "populationCensus"],
    });
  }

  async delete(id: number) {
    await this.speciesRepo.delete(id);
  }
}
