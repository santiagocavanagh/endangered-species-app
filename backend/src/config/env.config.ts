import dotenv from "dotenv";
import path from "path";

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
});

const requiredEnv = [
  "NODE_ENV",
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "JWT_SECRET",
  "JWT_EXPIRATION",
  "BCRYPT_ROUNDS",
];

requiredEnv.forEach((name) => {
  if (!process.env[name]) {
    throw new Error(`La variable de entorno ${name} no está definida`);
  }
});

export const ENV = {
  PORT: Number(process.env.PORT) || 3000,

  NODE_ENV: process.env.NODE_ENV as "development" | "production",

  FRONTEND_URL: process.env.FRONTEND_URL,

  DB: {
    HOST: process.env.DB_HOST as string,
    PORT: Number(process.env.DB_PORT),
    USER: process.env.DB_USER as string,
    PASSWORD: process.env.DB_PASSWORD as string,
    NAME: process.env.DB_NAME as string,
  },

  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION as string,

  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS as string, 10),

  IUCN_TOKEN: process.env.IUCN_API_TOKEN,
  IUCN_API_BASE: "https://api.iucnredlist.org/api/v4",
};
