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
import { CreateSpeciesDTO, UpdateSpeciesDTO } from "../dto/species.input.dto";
import { SpeciesQuery } from "../schemas/species.schema";
import { NotFoundError } from "../errors/http.error";

export class SpeciesService {
  private speciesRepo = AppDataSource.getRepository(Species);
  private regionRepo = AppDataSource.getRepository(Region);
  private taxonomyRepo = AppDataSource.getRepository(Taxonomy);

  //Query
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

  async getAll(query: SpeciesQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.speciesRepo
      .createQueryBuilder("species")
      .leftJoinAndSelect("species.regions", "regions")
      .leftJoinAndSelect("species.taxonomy", "taxonomy")
      .leftJoinAndSelect("species.media", "media");

    if (query.region) {
      qb.andWhere("LOWER(regions.name) LIKE LOWER(:region)", {
        region: `%${query.region}%`,
      });
    }

    if (query.taxonomy) {
      qb.andWhere("LOWER(taxonomy.kingdom) LIKE LOWER(:taxonomy)", {
        taxonomy: `%${query.taxonomy}%`,
      });
    }

    qb.orderBy("species.id", "DESC");

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOne(id: number) {
    const species = await this.speciesRepo.findOne({
      where: { id },
      relations: [
        "regions",
        "taxonomy",
        "media",
        "statusHistory",
        "populationCensus",
        "populationCensus.source",
      ],
    });

    if (!species) {
      throw new NotFoundError("Especie no encontrada");
    }

    // ultimo census
    const latest = species.populationCensus?.length
      ? species.populationCensus.sort(
          (a, b) => b.censusDate.getTime() - a.censusDate.getTime(),
        )[0]
      : null;

    return {
      ...species,
      populationCensus: latest ? [latest] : [],
    };
  }

  //Create
  async create(data: CreateSpeciesDTO) {
    const regions = await this.regionRepo.findBy({
      id: In(data.regionIds),
    });

    if (regions.length !== data.regionIds.length) {
      throw new NotFoundError("Regiones no encontradas");
    }

    const taxonomy = await this.taxonomyRepo.findOneBy({
      id: data.taxonomyId,
    });

    if (!taxonomy) {
      throw new NotFoundError("Taxonomía no encontrada");
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

    return this.getOne(savedSpecies.id);
  }

  //Update
  async update(id: number, data: UpdateSpeciesDTO) {
    const species = await this.speciesRepo.findOne({
      where: { id },
      relations: ["regions", "taxonomy"],
    });

    if (!species) {
      throw new NotFoundError("Especie no encontrada");
    }

    if (data.regionIds) {
      const regions = await this.regionRepo.findBy({
        id: In(data.regionIds),
      });

      if (regions.length !== data.regionIds.length) {
        throw new NotFoundError("Regiones no encontradas");
      }

      species.regions = regions;
    }

    if (data.taxonomyId) {
      const taxonomy = await this.taxonomyRepo.findOneBy({
        id: data.taxonomyId,
      });

      if (!taxonomy) {
        throw new NotFoundError("Taxonomía no encontrada");
      }

      species.taxonomy = taxonomy;
      species.taxonomyId = taxonomy.id;
    }

    species.scientificName = data.scientificName ?? species.scientificName;
    species.commonName = data.commonName ?? species.commonName;
    species.iucnStatus = data.iucnStatus ?? species.iucnStatus;
    species.description = data.description ?? species.description;
    species.habitat = data.habitat ?? species.habitat;

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

    return this.getOne(updatedSpecies.id);
  }

  //Delete
  async delete(id: number) {
    const species = await this.speciesRepo.findOneBy({ id });

    if (!species) {
      throw new NotFoundError("Especie no encontrada");
    }

    await this.speciesRepo.remove(species);
  }

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

    const source = await this.resolveSource(manager, data.sourceId);

    await censusRepo.save({
      species,
      censusDate: data.censusDate ?? new Date(),
      population: data.population!,
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

    let defaultSource = await dataSourceRepo.findOneBy({
      name: "user-submitted",
    });

    if (!defaultSource) {
      defaultSource = await dataSourceRepo.save({
        name: "user-submitted",
        url: null,
        type: DataSourceType.OTHER,
      });
    }

    return defaultSource;
  }
}
