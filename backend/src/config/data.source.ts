import "reflect-metadata";
import { DataSource } from "typeorm";
import { ENV } from "./env.config";

export const AppDataSource = new DataSource({
  type: "mysql",
  timezone: "Z",
  dateStrings: true,
  host: ENV.DB.HOST,
  port: ENV.DB.PORT,
  username: ENV.DB.USER,
  password: ENV.DB.PASSWORD,
  database: ENV.DB.NAME,
  entities:
    ENV.NODE_ENV === "development"
      ? ["src/**/*.entity.ts"]
      : ["dist/**/*.entity.js"],
  synchronize: ENV.NODE_ENV === "development" ? true : false,
  logging: ENV.NODE_ENV === "development" ? true : false,
  ssl: ENV.NODE_ENV === "production" ? { rejectUnauthorized: true } : false,
});
