import "reflect-metadata";
import dotenv from "dotenv";
import { DataSource } from "typeorm";
import { User } from "../entities/user.entity";
import { Species } from "../entities/species.entity";
import { Region } from "../entities/region.entity";
import { Favorite } from "../entities/favorites.entity";
import { Tendency } from "../entities/tendency.entity";
import { ENV } from "./env.config";

dotenv.config();

const production = ENV.NODE_ENV;

export const AppDataSource = new DataSource({
  type: "mysql",
  host: ENV.DB.HOST,
  port: Number(ENV.DB.PORT),
  username: process.env.DB_USER,
  password: ENV.DB.PASSWORD,
  database: ENV.DB.NAME,
  synchronize: !production,
  logging: !production,
  entities: [Species, User, Favorite, Region, Tendency],
  migrations: [],
  subscribers: [],
});
