import dotenv from "dotenv";
import path from "path";

const envFile =
  process.env["NODE_ENV"] === "production"
    ? ".env.production"
    : ".env.development";

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
});

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`La variable de entorno ${name} no está definida`);
  }
  return value;
}

export const ENV = {
  PORT: Number(process.env["PORT"] ?? 3000),

  NODE_ENV: getEnv("NODE_ENV") as "development" | "production",

  FRONTEND_URL: process.env["FRONTEND_URL"],

  DB: {
    HOST: getEnv("DB_HOST"),
    PORT: Number(getEnv("DB_PORT")),
    USER: getEnv("DB_USER"),
    PASSWORD: getEnv("DB_PASSWORD"),
    NAME: getEnv("DB_NAME"),
  },

  JWT_SECRET: getEnv("JWT_SECRET"),
  JWT_EXPIRATION: getEnv("JWT_EXPIRATION"),

  BCRYPT_ROUNDS: Number(getEnv("BCRYPT_ROUNDS")),

  IUCN_TOKEN: process.env["IUCN_API_TOKEN"] ?? null,
  IUCN_API_BASE: "https://api.iucnredlist.org/api/v4",
} as const;
