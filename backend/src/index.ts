import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/error.middleware";
import { AppDataSource } from "./config/data.source";
import { ENV } from "./config/env.config";
import authRoutes from "./routes/auth.routes";
import favoriteRoutes from "./routes/favorite.routes";
import speciesRoutes from "./routes/species.routes";
import regionRoutes from "./routes/region.routes";
import taxonomyRoutes from "./routes/taxonomy.routes";

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

const app = express();
app.disable("x-powered-by");
const allowedOrigins = [ENV.FRONTEND_URL];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// error handling
app.use(errorHandler);

// limit request body
app.use(express.json({ limit: "100kb" }));
app.use("/api/auth", authRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/species", speciesRoutes);
app.use("/api/regions", regionRoutes);
app.use("/api/taxonomies", taxonomyRoutes);

// test endpoint
app.get("/", (_req, res) => {
  res.send("backend Endangered Species funcionando!");
});

// manejo errores globales
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled error middleware:", err);
    try {
      const fs = require("fs");
      const path = require("path");
      const out = path.resolve(process.cwd(), "REPORTES", "backend_error.log");
      const msg = `[${new Date().toISOString()}] ${err && err.stack ? err.stack : JSON.stringify(err)}\n`;
      fs.appendFileSync(out, msg);
    } catch (writeErr) {
      console.error("Failed to write error log:", writeErr);
    }
    res.status(500).json({ error: "Internal server error" });
  },
);

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Conexión exitosa a MySQL con TypeORM");

    const PORT = ENV.PORT;

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar la aplicación:", error);
    process.exit(1);
  }
}

bootstrap();
