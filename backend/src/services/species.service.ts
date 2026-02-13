import { AppDataSource } from "../config/data.source";
import { Species } from "../entities/species.entity";

export class SpeciesService {
  private speciesRepo = AppDataSource.getRepository(Species);

  // Obtener lista de especies con filtros y paginación
  async getAll(filters: any, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const qb = this.speciesRepo
      .createQueryBuilder("species")
      .leftJoinAndSelect("species.region", "region")
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

    const [species, total] = await qb.getManyAndCount();

    const mapped = species.map((s) => ({
      ...s,
      scope: s.region.length > 2 ? "global" : "regional",
      visibleRegions: s.region.slice(0, 2),
    }));

    return { data: mapped, total };
  }

  // Obtener detalles de una especie
  async getOne(id: number) {
    const species = await this.speciesRepo.findOne({
      where: { id },
      relations: ["tendencyHistory", "region"],
    });

    if (!species) return null;

    return {
      ...species,
      scope: species.region.length > 2 ? "global" : "regional",
    };
  }
}
