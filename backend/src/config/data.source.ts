import "reflect-metadata";
import { DataSource } from "typeorm";
import { ENV } from "./env.config";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: ENV.DB.HOST,
  port: ENV.DB.PORT,
  username: ENV.DB.USER,
  password: ENV.DB.PASSWORD,
  database: ENV.DB.NAME,
  entities:
    ENV.NODE_ENV === "production"
      ? ["dist/**/*.entity.js"]
      : ["src/**/*.entity.ts"],
  synchronize: false,
  logging: ENV.NODE_ENV === "development",
  ssl: ENV.NODE_ENV === "production" ? { rejectUnauthorized: true } : false,
});
