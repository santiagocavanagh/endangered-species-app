import { AppDataSource } from "../config/data.source";
import { Region } from "../entities/region.entity";
import { NotFoundError } from "../errors/http.error";

export class RegionService {
  private regionRepo = AppDataSource.getRepository(Region);

  async getAll() {
    return this.regionRepo.find({
      order: { name: "ASC" },
    });
  }

  async getOne(id: number) {
    const region = await this.regionRepo.findOneBy({ id });

    if (!region) {
      throw new NotFoundError("Región no encontrada");
    }

    return region;
  }
}
