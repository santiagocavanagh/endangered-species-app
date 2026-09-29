import { AppDataSource } from "../config/data.source";
import { Taxonomy } from "../entities/taxonomy.entity";
import { NotFoundError } from "../errors/http.error";

export class TaxonomyService {
  private taxonomyRepo = AppDataSource.getRepository(Taxonomy);

  async getAll(kingdom?: string) {
    if (kingdom) {
      return this.taxonomyRepo.findBy({ kingdom: kingdom.toUpperCase() });
    }
    return this.taxonomyRepo.find();
  }

  async getOne(id: number) {
    const taxonomy = await this.taxonomyRepo.findOneBy({ id });

    if (!taxonomy) {
      throw new NotFoundError("Taxonomía no encontrada");
    }

    return taxonomy;
  }
}
