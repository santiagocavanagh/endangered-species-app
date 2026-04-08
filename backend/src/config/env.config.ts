import dotenv from "dotenv";
import path from "path";

const envFile =
  process.env["NODE_ENV"] === "production"
    ? ".env.production"
    : ".env.development";

const envPath = path.resolve(process.cwd(), envFile);

const result = dotenv.config({ path: envPath });

if (result.error) {
  throw new Error(`No se pudo cargar ${envFile}`);
}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`La variable de entorno ${name} no está definida`);
  }
  return value;
}

function getEnvNumber(name: string): number {
  const value = getEnv(name);
  const num = Number(value);

  if (!Number.isInteger(num) || num <= 0) {
    throw new Error(`La variable ${name} debe ser un número entero positivo`);
  }

  return num;
}

function getEnvEnum<T extends string>(name: string, allowed: readonly T[]): T {
  const value = getEnv(name);

  if (!allowed.includes(value as T)) {
    throw new Error(
      `La variable ${name} debe ser uno de: ${allowed.join(", ")}`,
    );
  }

  return value as T;
}

export const ENV = {
  PORT: process.env["PORT"] ? getEnvNumber("PORT") : 3000,

  NODE_ENV: getEnvEnum("NODE_ENV", ["development", "production"] as const),

  FRONTEND_URL: process.env["FRONTEND_URL"] ?? null,

  JWT_SECRET: getEnv("JWT_SECRET"),
  JWT_EXPIRATION: getEnv("JWT_EXPIRATION"),

  BCRYPT_ROUNDS: getEnvNumber("BCRYPT_ROUNDS"),
  ADMIN_REGISTER_SECRET: process.env["ADMIN_REGISTER_SECRET"] ?? null,

  DB: {
    HOST: getEnv("DB_HOST"),
    PORT: getEnvNumber("DB_PORT"),
    USER: getEnv("DB_USER"),
    PASSWORD: getEnv("DB_PASSWORD"),
    NAME: getEnv("DB_NAME"),
  },

  IUCN_API_TOKEN: process.env["IUCN_API_TOKEN"] ?? null,
  IUCN_API_BASE: "https://api.iucnredlist.org/api/v4",
} as const;
