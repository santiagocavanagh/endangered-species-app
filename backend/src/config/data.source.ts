import "reflect-metadata";
import { DataSource } from "typeorm";
import { Species } from "../entities/species.entity";
import { User } from "../entities/user.entity";
import { Favorite } from "../entities/favorites.entity";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: true,
  entities: [Species, User, Favorite],
  migrations: [],
  subscribers: [],
});
