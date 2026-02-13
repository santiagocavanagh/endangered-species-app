import { AppDataSource } from "../config/data.source";
import { Species } from "../entities/species.entity";

interface GetAllFilters {
  region?: string;
  category?: string;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export class SpeciesService {
  private speciesRepo = AppDataSource.getRepository(Species);

  // Obtener todas con filtros y paginación
  async getAll(
    filters: GetAllFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Species & { scope: string }>> {
    const skip = (page - 1) * limit;

    const qb = this.speciesRepo
      .createQueryBuilder("species")
      .leftJoinAndSelect("species.region", "region")
      .where("species.isVisible = :visible", { visible: true })
      .skip(skip)
      .take(limit);

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

    qb.orderBy("species.name", "ASC");

    const [speciesList, total] = await qb.getManyAndCount();

    const transformed = speciesList.map((species) => ({
      ...species,
      scope: this.calculateScope(species),
    }));

    return {
      data: transformed,
      total,
    };
  }

  // Obtener una especie por ID
  async getOne(id: number): Promise<(Species & { scope: string }) | null> {
    const species = await this.speciesRepo.findOne({
      where: {
        id,
        isVisible: true,
      },
      relations: ["region", "tendencyHistory"],
    });

    if (!species) {
      return null;
    }

    return {
      ...species,
      scope: this.calculateScope(species),
    };
  }

  // Cálculo dinámico de scope
  private calculateScope(species: Species): string {
    if (!species.region || species.region.length === 0) {
      return "unknown";
    }

    if (species.region.length > 2) {
      return "global";
    }

    return "regional";
  }
}
