import { AppDataSource } from "../config/data.source";
import { Taxonomy } from "../entities/taxonomy.entity";
import { NotFoundError, BadRequestError } from "../errors/http.error";

export class TaxonomyService {
  private taxonomyRepo = AppDataSource.getRepository(Taxonomy);

  async getAll() {
    return this.taxonomyRepo.find();
  }

  async getOne(id: number) {
    if (!id || isNaN(id)) {
      throw new BadRequestError("Invalid ID");
    }

    const taxonomy = await this.taxonomyRepo.findOneBy({ id });

    if (!taxonomy) {
      throw new NotFoundError("Taxonomía no encontrada");
    }

    return taxonomy;
  }
}
