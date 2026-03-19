import { In, EntityManager } from "typeorm";
import { AppDataSource } from "../config/data.source";
import { Species } from "../entities/species.entity";
import { Region } from "../entities/region.entity";
import { PopulationCensus } from "../entities/population-census.entity";
import { Taxonomy } from "../entities/taxonomy.entity";
import {
  DataSource as DataSourceEntity,
  DataSourceType,
} from "../entities/data-source.entity";
import { CreateSpeciesDTO, UpdateSpeciesDTO } from "../dto/species.dto";

export class SpeciesService {
  private speciesRepo = AppDataSource.getRepository(Species);
  private regionRepo = AppDataSource.getRepository(Region);
  private taxonomyRepo = AppDataSource.getRepository(Taxonomy);

  //QUERIES SPECIES
  async getCritical() {
    return this.speciesRepo.find({
      where: { iucnStatus: In(["CR", "EN", "VU"]) },
      relations: this.baseRelations(),
    });
  }

  async getRescued() {
    return this.speciesRepo.find({
      where: { iucnStatus: In(["NT", "LC"]) },
      relations: this.baseRelations(),
    });
  }

  async getAll() {
    return this.speciesRepo.find({
      relations: this.baseRelations(),
    });
  }

  async getOne(id: number) {
    const species = await this.speciesRepo.findOne({
      where: { id },
      relations: [...this.baseRelations(), "statusHistory"],
    });

    if (!species) {
      throw new Error("Especie no encontrada");
    }

    return species;
  }

  //CREATE SPECIES
  async create(data: CreateSpeciesDTO) {
    const uniqueRegionIds = [...new Set(data.regionIds)];

    const regions = await this.regionRepo.findBy({
      id: In(uniqueRegionIds),
    });

    if (regions.length !== uniqueRegionIds.length) {
      throw new Error("Regiones no encontradas");
    }

    const taxonomy = await this.taxonomyRepo.findOneBy({
      id: data.taxonomyId,
    });

    if (!taxonomy) {
      throw new Error("Taxonomía no encontrada");
    }

    const species = this.speciesRepo.create({
      scientificName: data.scientificName,
      commonName: data.commonName ?? null,
      iucnStatus: data.iucnStatus,
      taxonomy,
      taxonomyId: taxonomy.id,
      description: data.description ?? null,
      habitat: data.habitat ?? null,
      regions,
    });

    const savedSpecies = await AppDataSource.manager.transaction(
      async (manager) => {
        const speciesRepo = manager.getRepository(Species);
        const created = await speciesRepo.save(species);

        if (data.population !== undefined) {
          await this.createPopulationCensus(manager, created, data);
        }

        return created;
      },
    );

    return this.speciesRepo.findOne({
      where: { id: savedSpecies.id },
      relations: this.baseRelations(),
    });
  }

  //UPDATE SPECIES
  async update(id: number, data: UpdateSpeciesDTO) {
    const species = await this.speciesRepo.findOne({
      where: { id },
      relations: ["regions", "taxonomy"],
    });

    if (!species) {
      throw new Error("Especie no encontrada");
    }

    if (data.regionIds && data.regionIds.length > 0) {
      const uniqueRegionIds = [...new Set(data.regionIds)];

      const regions = await this.regionRepo.findBy({
        id: In(uniqueRegionIds),
      });

      if (regions.length !== uniqueRegionIds.length) {
        throw new Error("Regiones no encontradas");
      }

      species.regions = regions;
    }

    if (data.taxonomyId) {
      const taxonomy = await this.taxonomyRepo.findOneBy({
        id: data.taxonomyId,
      });

      if (!taxonomy) {
        throw new Error("Taxonomía no encontrada");
      }

      species.taxonomy = taxonomy;
      species.taxonomyId = taxonomy.id;
    }

    const {
      regionIds,
      taxonomyId,
      population,
      censusDate,
      sourceId,
      notes,
      ...safeData
    } = data;

    Object.assign(species, safeData);

    const updatedSpecies = await AppDataSource.manager.transaction(
      async (manager) => {
        const speciesRepo = manager.getRepository(Species);

        const updated = await speciesRepo.save(species);

        if (data.population !== undefined) {
          await this.createPopulationCensus(manager, updated, data);
        }

        return updated;
      },
    );

    return this.speciesRepo.findOne({
      where: { id: updatedSpecies.id },
      relations: this.baseRelations(),
    });
  }

  //DELETE SPECIES
  async delete(id: number) {
    const species = await this.speciesRepo.findOneBy({ id });

    if (!species) {
      throw new Error("Especie no encontrada");
    }

    await this.speciesRepo.delete(id);
  }

  //PRIVATE HELPERS
  private baseRelations() {
    return [
      "regions",
      "taxonomy",
      "media",
      "populationCensus",
      "populationCensus.source",
    ];
  }

  private async createPopulationCensus(
    manager: EntityManager,
    species: Species,
    data: CreateSpeciesDTO | UpdateSpeciesDTO,
  ) {
    const censusRepo = manager.getRepository(PopulationCensus);

    if (typeof data.population !== "number") {
      throw new Error("Population inválida");
    }

    const source = await this.resolveSource(manager, data.sourceId);

    const censusDate = data.censusDate ? new Date(data.censusDate) : new Date();

    censusDate.setHours(0, 0, 0, 0);

    await censusRepo.save({
      species,
      censusDate,
      population: data.population,
      source,
      notes: data.notes ?? null,
    });
  }

  private async resolveSource(
    manager: EntityManager,
    sourceId?: number,
  ): Promise<DataSourceEntity> {
    const dataSourceRepo = manager.getRepository(DataSourceEntity);

    if (sourceId) {
      const source = await dataSourceRepo.findOneBy({ id: sourceId });
      if (source) return source;
    }

    await dataSourceRepo.upsert(
      {
        name: "user-submitted",
        url: null,
        type: DataSourceType.OTHER,
      },
      ["name"],
    );

    const defaultSource = await dataSourceRepo.findOneByOrFail({
      name: "user-submitted",
    });

    return defaultSource;
  }
}
