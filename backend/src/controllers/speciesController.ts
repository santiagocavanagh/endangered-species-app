import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Species } from "../entities/species";

export class speciesController {
    static async getAll(req: Request, res: Response) {
        const speciesRepository = AppDataSource.getRepository(Species);
        const species = await speciesRepository.find();
        return res.json(species);
    }
}