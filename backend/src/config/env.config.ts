import dotenv from "dotenv";

dotenv.config();

const requiredEnv = [
  "JWT_SECRET",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "DB_HOST",
  "DB_PORT",
  "NODE_ENV",
];

requiredEnv.forEach((name) => {
  if (!process.env[name]) {
    throw new Error(`La variable de entorno ${name} no está definida`);
  }
});

export const ENV = {
  PORT: process.env.PORT || 3000,
  FRONTEND_URL: process.env.FRONTEND_URL,
  DB: {
    HOST: process.env.DB_HOST,
    PORT: Number(process.env.DB_PORT),
    USER: process.env.DB_USER,
    PASSWORD: process.env.DB_PASSWORD,
    NAME: process.env.DB_NAME,
  },
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || "24h",
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || "12", 10),
  IUCN_TOKEN: process.env.IUCN_API_TOKEN,
  IUCN_API_BASE: "https://api.iucnredlist.org/api/v4",
  NODE_ENV: process.env.NODE_ENV,
};
