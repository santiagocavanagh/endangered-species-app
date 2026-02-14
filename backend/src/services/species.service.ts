import { AppDataSource } from "../config/data.source";
import { Species } from "../entities/species.entity";
import { Region } from "../entities/region.entity";
import { Tendency } from "../entities/tendency.entity";
import { In } from "typeorm";
import { CreateDTO, UpdateDTO } from "../dto/species.dto";

export class SpeciesService {
  private speciesRepo = AppDataSource.getRepository(Species);
  private regionRepo = AppDataSource.getRepository(Region);
  private tendencyRepo = AppDataSource.getRepository(Tendency);

  // READ
  async getCritical() {
    return this.speciesRepo.find({
      where: { status: In(["EX", "CR", "EN", "VU"]) },
      relations: ["region"],
      order: { populationValue: "ASC" },
    });
  }

  async getRescued() {
    return this.speciesRepo.find({
      where: { status: In(["NT", "LC"]) },
      relations: ["region"],
      order: { populationValue: "DESC" },
    });
  }

  async getOne(id: number) {
    return this.speciesRepo.findOne({
      where: { id },
      relations: ["region", "tendencyHistory"],
    });
  }

  // CREATE
  async create(data: CreateDTO) {
    const regions = await this.regionRepo.findBy({
      id: In(data.regionIds),
    });

    const species = this.speciesRepo.create({
      scientificName: data.scientificName,
      name: data.name,
      category: data.category,
      habitat: data.habitat,
      status: data.status,
      populationValue: data.populationValue,
      populationOperator: data.populationOperator ?? null,
      imageUrl: data.imageUrl,
      region: regions,
    });

    const saved = await this.speciesRepo.save(species);

    await this.tendencyRepo.save({
      species: saved,
      date: data.censusDate,
      population: data.populationValue,
    });

    return saved;
  }

  // UPDATE
  async update(id: number, data: UpdateDTO) {
    const species = await this.speciesRepo.findOne({
      where: { id },
      relations: ["region"],
    });

    if (!species) throw new Error("Species not found");

    if (data.regionIds) {
      species.region = await this.regionRepo.findBy({
        id: In(data.regionIds),
      });
    }

    const previousPopulation = species.populationValue;

    Object.assign(species, {
      scientificName: data.scientificName ?? species.scientificName,
      name: data.name ?? species.name,
      category: data.category ?? species.category,
      habitat: data.habitat ?? species.habitat,
      status: data.status ?? species.status,
      populationValue: data.populationValue ?? species.populationValue,
      populationOperator: data.populationOperator ?? species.populationOperator,
      imageUrl: data.imageUrl ?? species.imageUrl,
    });

    const updated = await this.speciesRepo.save(species);

    // Si cambia población, registrar censo y recalcular tendencia
    if (
      data.populationValue !== undefined &&
      data.populationValue !== previousPopulation &&
      data.censusDate
    ) {
      await this.tendencyRepo.save({
        species: updated,
        date: data.censusDate,
        population: data.populationValue,
      });

      if (data.populationValue > previousPopulation)
        updated.currentTrend = "aumento";
      else if (data.populationValue < previousPopulation)
        updated.currentTrend = "descenso";
      else updated.currentTrend = "estable";

      await this.speciesRepo.save(updated);
    }

    return updated;
  }

  // DELETE
  async delete(id: number) {
    await this.speciesRepo.delete(id);
  }
}
