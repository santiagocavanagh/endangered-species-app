import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { Species } from "./entities/species";
import { User } from "./entities/user";
import { Favorite } from "./entities/favorites";

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
