import "reflect-metadata";
import { DataSource } from "typeorm";
import { ENV } from "./env.config";

const production = ENV.NODE_ENV === "production";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: ENV.DB.HOST,
  port: Number(ENV.DB.PORT),
  username: ENV.DB.USER,
  password: ENV.DB.PASSWORD,
  database: ENV.DB.NAME,
  synchronize: !production,
  logging: !production,
  entities: [__dirname + "/../entities/*.entity.{ts,js}"],
  migrations: [],
  subscribers: [],
});
