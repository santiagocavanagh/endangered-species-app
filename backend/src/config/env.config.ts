import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 3000,
  DB: {
    HOST: process.env.DB_HOST || "localhost",
    PORT: Number(process.env.DB_PORT) || 3306,
    USER: process.env.DB_USER || "root",
    PASSWORD: process.env.DB_PASSWORD,
    NAME: process.env.DB_NAME || "wws",
  },
  JWT_SECRET: process.env.JWT_SECRET || "secret",
  IUCN_TOKEN: process.env.IUCN_API_TOKEN,
  IUCN_API_BASE: "https://api.iucnredlist.org/api/v4",
};
