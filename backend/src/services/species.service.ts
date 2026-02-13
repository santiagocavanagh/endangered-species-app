import { AppDataSource } from "../config/data.source";
import { Species } from "../entities/species.entity";
import { Region } from "../entities/region.entity";
import { SpeciesDTO } from "../dto/species.dto";
import { In, IsNull } from "typeorm";

type Category = "animal" | "planta" | "hongo";
type Status = "CR" | "EN" | "VU" | "NT" | "LC" | "EX";
type Trend = "aumento" | "descenso" | "estable" | "desconocido";

interface Filters {
  region?: string;
  category?: Category;
}

interface CreateSpeciesInput {
  scientificName: string;
  name: string;
  category: Category;
  habitat: string;
  status: Status;
  imageUrl: string;
  populationValue: number;
  populationOperator?: string | null;
  currentTrend?: Trend;
  region: number[];
}

type UpdateSpeciesInput = Partial<CreateSpeciesInput>;

interface Paginated<T> {
  data: T[];
  total: number;
}

export class SpeciesService {
  private speciesRepo = AppDataSource.getRepository(Species);
  private regionRepo = AppDataSource.getRepository(Region);

  // Get All + Filters + Pagination + Sorting
  async getAll(
    filters: Filters,
    page: number,
    limit: number,
  ): Promise<Paginated<SpeciesDTO>> {
    const skip = (page - 1) * limit;

    const qb = this.speciesRepo
      .createQueryBuilder("species")
      .leftJoinAndSelect("species.region", "region")
      .where("species.deletedAt IS NULL")
      .skip(skip)
      .take(limit)
      .orderBy("species.name", "ASC");

    if (filters.category) {
      qb.andWhere("species.category = :category", {
        category: filters.category,
      });
    }

    if (filters.region) {
      qb.andWhere("region.name = :region", {
        region: filters.region,
      });
    }

    const [entities, total] = await qb.getManyAndCount();

    return {
      data: entities.map((e) => this.toDTO(e)),
      total,
    };
  }

  // Get One
  async getOne(id: number): Promise<SpeciesDTO | null> {
    const entity = await this.speciesRepo.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
      relations: ["region", "tendencyHistory"],
    });

    if (!entity) return null;

    return this.toDTO(entity);
  }

  // Create
  async create(data: CreateSpeciesInput): Promise<SpeciesDTO> {
    const regions = await this.resolveRegions(data.region);

    const entity = this.speciesRepo.create({
      ...data,
      populationOperator: data.populationOperator ?? null,
      currentTrend: data.currentTrend ?? "desconocido",
      region: regions,
    });

    const saved = await this.speciesRepo.save(entity);

    return this.toDTO(saved);
  }

  // Update
  async update(
    id: number,
    data: UpdateSpeciesInput,
  ): Promise<SpeciesDTO | null> {
    const entity = await this.speciesRepo.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
      relations: ["region"],
    });

    if (!entity) return null;

    // Resolver regiones si vienen
    if (data.region) {
      entity.region = await this.resolveRegions(data.region);
    }

    // Actualizar propiedades escalares manualmente
    if (data.scientificName !== undefined)
      entity.scientificName = data.scientificName;

    if (data.name !== undefined) entity.name = data.name;

    if (data.category !== undefined) entity.category = data.category;

    if (data.habitat !== undefined) entity.habitat = data.habitat;

    if (data.status !== undefined) entity.status = data.status;

    if (data.imageUrl !== undefined) entity.imageUrl = data.imageUrl;

    if (data.populationValue !== undefined)
      entity.populationValue = data.populationValue;

    if (data.populationOperator !== undefined)
      entity.populationOperator = data.populationOperator ?? null;

    if (data.currentTrend !== undefined)
      entity.currentTrend = data.currentTrend;

    const updated = await this.speciesRepo.save(entity);

    return this.toDTO(updated);
  }

  // Soft Delete
  async delete(id: number): Promise<boolean> {
    const result = await this.speciesRepo.softDelete(id);
    return !!result.affected;
  }

  // Regiones Dinamico
  private async resolveRegions(regionIds: number[]): Promise<Region[]> {
    const regions = await this.regionRepo.find({
      where: { id: In(regionIds) },
    });

    if (regions.length !== regionIds.length) {
      throw new Error("Una o más regiones no existen");
    }

    return regions;
  }

  // DTO Transformer
  private toDTO(entity: Species): SpeciesDTO {
    return {
      id: entity.id,
      scientificName: entity.scientificName,
      name: entity.name,
      category: entity.category,
      habitat: entity.habitat,
      status: entity.status,
      imageUrl: entity.imageUrl,

      region: entity.region?.map((r) => r.name) ?? [],

      scope: this.calculateScope(entity.region),
      populationDisplay: this.populationDisplay(entity),
      riskLevel: this.riskLevel(entity.status),
      isCritical: ["CR", "EN", "VU"].includes(entity.status),
      trendDirection: this.normalizeTrend(entity.currentTrend),
    };
  }

  // Scope Dinamico
  private calculateScope(regions: Region[]) {
    if (!regions?.length) return "unknown";
    return regions.length > 2 ? "global" : "regional";
  }

  private populationDisplay(entity: Species) {
    const op = entity.populationOperator ?? "";
    return `${op} ${entity.populationValue}`.trim();
  }

  private riskLevel(status: Status) {
    const map: Record<Status, number> = {
      CR: 4,
      EN: 3,
      VU: 2,
      NT: 1,
      LC: 0,
      EX: 5,
    };
    return map[status];
  }

  private normalizeTrend(trend: Trend): "up" | "down" | "stable" | "unknown" {
    switch (trend) {
      case "aumento":
        return "up";
      case "descenso":
        return "down";
      case "estable":
        return "stable";
      default:
        return "unknown";
    }
  }
}
