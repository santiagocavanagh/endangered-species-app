import "reflect-metadata";
import { DataSource } from "typeorm";
import { Species } from "../entities/species.entity";
import { User } from "../entities/user.entity";
import { Favorite } from "../entities/favorites.entity";
import { Tendency } from "../entities/tendency.entity";
import { ENV } from "./env.config";
import dotenv from "dotenv";

dotenv.config();

const production = ENV.NODE_ENV;

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: !production,
  logging: !production,
  entities: [Species, User, Favorite, Tendency],
  migrations: [],
  subscribers: [],
});
