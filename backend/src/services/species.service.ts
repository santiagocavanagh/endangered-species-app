import { In, EntityManager } from "typeorm";
import { AppDataSource } from "../config/data.source";
import { Species } from "../entities/species.entity";
import { Region } from "../entities/region.entity";
import { PopulationCensus } from "../entities/population-census.entity";
import { Taxonomy } from "../entities/taxonomy.entity";
import { SpeciesMedia } from "../entities/species-media.entity";
import {
  DataSource as DataSourceEntity,
  DataSourceType,
} from "../entities/data-source.entity";
import { CreateSpeciesDTO, UpdateSpeciesDTO } from "../DTO/species.input.dto";
import { SpeciesQuery } from "../schemas/species.schema";
import { NotFoundError } from "../errors/http.error";

const HABITAT_KEYWORDS: Record<string, string[]> = {
  bosque: [
    "forest",
    "bosque",
    "woodland",
    "tropical moist",
    "temperate forest",
  ],
  marino: [
    "marine",
    "oceanic",
    "ocean",
    "sea",
    "coastal",
    "neritic",
    "intertidal",
    "coral",
  ],
  desierto: ["desert", "arid", "xeric", "dry"],
  montaña: ["rocky", "alpine", "montane", "mountain", "hill", "slope"],
  tropical: ["tropical", "subtropical"],
  templado: ["temperate", "temperado", "mediterranean"],
  desertico: ["desert", "arid", "xeric", "dry"],
  acuatico: [
    "wetlands",
    "freshwater",
    "river",
    "stream",
    "lake",
    "pond",
    "marsh",
    "swamp",
    "bog",
    "aquatic",
  ],
  pradera: ["grassland", "savanna", "prairie", "steppe", "meadow"],
  humedo: ["swamp", "marsh", "humid", "moist", "bog", "peatland"],
  artificial: [
    "artificial",
    "plantations",
    "pastureland",
    "arable",
    "gardens",
    "urban",
    "aquaculture",
    "canals",
    "excavations",
  ],
  unknown: ["unknown", "other"],
};

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
    const offset = (page - 1) * limit;

    //1) IDs filtrados
    const idQb = this.speciesRepo
      .createQueryBuilder("s")
      .select("s.id", "id")
      .innerJoin("s.taxonomy", "t")
      .leftJoin("s.regions", "r");

    if (query.taxonomy) {
      idQb.andWhere("LOWER(t.kingdom) LIKE LOWER(:taxonomy)", {
        taxonomy: `%${query.taxonomy}%`,
      });
    }
    if (query.status) {
      idQb.andWhere("s.iucnStatus = :status", {
        status: query.status.toUpperCase(),
      });
    }
    if (query.search) {
      idQb.andWhere(
        "(LOWER(s.scientificName) LIKE LOWER(:search) OR LOWER(s.commonName) LIKE LOWER(:search))",
        { search: `%${query.search}%` },
      );
    }
    if (query.region) {
      idQb.andWhere("LOWER(r.name) = LOWER(:region)", {
        region: query.region,
      });
    }
    if (query.habitat) {
      const keywords = HABITAT_KEYWORDS[query.habitat] ?? [query.habitat];
      const conditions = keywords
        .map((_, i) => `LOWER(s.habitat) LIKE LOWER(:hk${i})`)
        .join(" OR ");
      const params = Object.fromEntries(
        keywords.map((kw, i) => [`hk${i}`, `%${kw}%`]),
      );
      idQb.andWhere(`s.habitat IS NOT NULL AND (${conditions})`, params);
    }

    idQb.distinct(true);

    const total = await idQb.getCount();
    const idRows = await idQb
      .orderBy("s.id", "DESC")
      .limit(limit)
      .offset(offset)
      .getRawMany();

    if (idRows.length === 0) {
      return { data: [], meta: { total, page, limit, totalPages: 0 } };
    }

    const ids: number[] = idRows.map((r) => Number(r.id));

    //2) datos completos para esos IDs (PK lookup)
    const data = await this.speciesRepo
      .createQueryBuilder("species")
      .leftJoinAndSelect("species.regions", "regions")
      .leftJoinAndSelect("species.taxonomy", "taxonomy")
      .leftJoinAndSelect("species.media", "media")
      .leftJoinAndSelect("species.populationCensus", "populationCensus")
      .leftJoinAndSelect("populationCensus.source", "censusSource")
      .where("species.id IN (:...ids)", { ids })
      .orderBy("species.id", "DESC")
      .getMany();

    //3) latestCensus calculado
    const enriched = data.map((s) => ({
      ...s,
      latestCensus: s.populationCensus?.length
        ? s.populationCensus.reduce((a, b) =>
            new Date(b.censusDate) > new Date(a.censusDate) ? b : a,
          )
        : null,
    }));

    return {
      data: enriched,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
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

    return species;
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

        if (data.imageUrl) {
          const mediaRepo = manager.getRepository(SpeciesMedia);
          await mediaRepo.save({
            mediaUrl: data.imageUrl,
            mediaType: "image",
            species: created,
            credit: null,
            license: null,
          });
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
    species.commonName =
      data.commonName !== undefined
        ? (data.commonName ?? null)
        : species.commonName;
    species.iucnStatus = data.iucnStatus ?? species.iucnStatus;
    species.description =
      data.description !== undefined
        ? (data.description ?? null)
        : species.description;
    species.habitat =
      data.habitat !== undefined ? (data.habitat ?? null) : species.habitat;

    const updatedSpecies = await AppDataSource.manager.transaction(
      async (manager) => {
        const speciesRepo = manager.getRepository(Species);
        const updated = await speciesRepo.save(species);

        if (data.population !== undefined) {
          await this.createPopulationCensus(manager, updated, data);
        }

        if (data.imageUrl !== undefined) {
          const mediaRepo = manager.getRepository(SpeciesMedia);
          // Elimina la imagen anterior y reemplaza con la nueva
          await mediaRepo.delete({ species: { id: updated.id } });
          if (data.imageUrl) {
            await mediaRepo.save({
              mediaUrl: data.imageUrl,
              mediaType: "image",
              species: updated,
              credit: null,
              license: null,
            });
          }
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

  // Insertar/Guardar Poblacion
  private async createPopulationCensus(
    manager: EntityManager,
    species: Species,
    data: CreateSpeciesDTO | UpdateSpeciesDTO,
  ) {
    const censusRepo = manager.getRepository(PopulationCensus);
    const source = await this.resolveSource(manager, data.sourceId);
    const censusDate =
      data.censusDate ?? new Date().toISOString().split("T")[0];

    const existingCensus = await censusRepo
      .createQueryBuilder("census")
      .leftJoin("census.species", "species")
      .where("species.id = :speciesId", { speciesId: species.id })
      .andWhere("census.censusDate = :censusDate", { censusDate })
      .getOne();

    if (existingCensus) {
      existingCensus.population = data.population!;
      existingCensus.populationDisplay = data.populationDisplay ?? null;
      existingCensus.source = source;
      existingCensus.notes = data.notes ?? null;
      await censusRepo.save(existingCensus);
      return;
    }

    await censusRepo.save({
      species,
      censusDate,
      population: data.population!,
      populationDisplay: data.populationDisplay ?? null,
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
