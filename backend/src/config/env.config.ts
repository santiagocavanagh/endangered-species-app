import dotenv from "dotenv";
dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error(
    "❌ FATAL ERROR: JWT_SECRET no está definido en el archivo .env",
  );
}

export const ENV = {
  PORT: process.env.PORT || 3000,
  DB: {
    HOST: process.env.DB_HOST || "localhost",
    PORT: Number(process.env.DB_PORT) || 3306,
    USER: process.env.DB_USER,
    PASSWORD: process.env.DB_PASSWORD,
    NAME: process.env.DB_NAME,
  },
  JWT_SECRET: process.env.JWT_SECRET,
  IUCN_TOKEN: process.env.IUCN_API_TOKEN,
  IUCN_API_BASE: "https://api.iucnredlist.org/api/v4",
  NODE_ENV: process.env.NODE_ENV || "development",
};
