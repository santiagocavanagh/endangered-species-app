import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middleware/error.middleware";
import { AppDataSource } from "./config/data.source";
import { ENV } from "./config/env.config";
import routes from "./routes/index.routes";

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

const app = express();
app.set("trust proxy", 1);

const allowedOrigins: string[] = ENV.FRONTEND_URL ? [ENV.FRONTEND_URL] : [];

function isAllowedOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    const isDev = ENV.NODE_ENV === "development";

    return (
      (isDev || url.protocol === "https:") &&
      allowedOrigins.some((allowed) => {
        const allowedUrl = new URL(allowed);
        return url.origin === allowedUrl.origin;
      })
    );
  } catch {
    return false;
  }
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        if (ENV.NODE_ENV === "development") return callback(null, true);
        return callback(new Error("Origin requerido"), false);
      }

      if (!isAllowedOrigin(origin)) {
        return callback(new Error("Not allowed by CORS"), false);
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// limit request body
app.use(express.json({ limit: "100kb" }));
app.use("/api", routes);

// error handling
app.use(errorHandler);

// test endpoint
if (ENV.NODE_ENV === "development") {
  app.get("/health", (_req, res) => {
    res.json({ status: "Status: ✅ ok" });
  });
}

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Conexión exitosa a la base de datos");

    const PORT = ENV.PORT;

    app.listen(PORT, () => {
      console.log(`🚀 Servidor: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar la aplicación:", error);
    process.exit(1);
  }
}

bootstrap();
