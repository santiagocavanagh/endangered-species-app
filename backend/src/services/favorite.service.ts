import { AppDataSource } from "../config/data.source";
import { Favorite } from "../entities/favorite.entity";
import { Species } from "../entities/species.entity";
import { User } from "../entities/user.entity";
import { SpeciesMapper } from "../mappers/species.mapper";
import { NotFoundError, BadRequestError } from "../errors/http.error";

export class FavoriteService {
  private favoriteRepo = AppDataSource.getRepository(Favorite);
  private speciesRepo = AppDataSource.getRepository(Species);

  async getFavorites(userId: number) {
    const favorites = await this.favoriteRepo.find({
      where: { user: { id: userId } },
      relations: [
        "species",
        "species.taxonomy",
        "species.regions",
        "species.media",
        "species.populationCensus",
        "species.populationCensus.source",
      ],
    });

    return favorites.map((fav) => SpeciesMapper(fav.species));
  }

  async addFavorite(userId: number, speciesId: number) {
    const species = await this.speciesRepo.findOneBy({ id: speciesId });

    if (!species) {
      throw new NotFoundError("Especie no encontrada");
    }

    const existing = await this.favoriteRepo.findOne({
      where: {
        user: { id: userId },
        species: { id: speciesId },
      },
    });

    if (existing) {
      throw new BadRequestError("Ya es favorito");
    }

    const favorite = this.favoriteRepo.create({
      user: { id: userId } as User,
      species: { id: speciesId } as Species,
    });

    await this.favoriteRepo.save(favorite);

    return { message: "Agregado a favoritos" };
  }

  async removeFavorite(userId: number, speciesId: number) {
    const favorite = await this.favoriteRepo.findOne({
      where: {
        user: { id: userId },
        species: { id: speciesId },
      },
    });

    if (!favorite) {
      throw new NotFoundError("No encontrado");
    }

    await this.favoriteRepo.remove(favorite);

    return { message: "Eliminado de favoritos" };
  }
}
