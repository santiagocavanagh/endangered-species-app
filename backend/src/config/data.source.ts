import "reflect-metadata";
import { DataSource } from "typeorm";
import { ENV } from "../config/env.config";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: ENV.DB.HOST,
  port: ENV.DB.PORT,
  username: ENV.DB.USER,
  password: ENV.DB.PASSWORD,
  database: ENV.DB.NAME,
  entities:
    process.env.NODE_ENV === "production"
      ? ["dist/**/*.entity.js"]
      : ["src/**/*.entity.ts"],
  synchronize: false,
  logging: ENV.NODE_ENV === "development",
});
