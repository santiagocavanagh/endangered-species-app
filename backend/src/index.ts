import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./config/data.source";
import { ENV } from "./config/env.config";
import authRoutes from "./routes/auth.routes";
import favoriteRoutes from "./routes/favorite.routes";
import speciesRoutes from "./routes/species.routes";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: ENV.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/species", speciesRoutes);

AppDataSource.initialize()
  .then(() => {
    console.log("✅ Conexión exitosa a MySQL con TypeORM");

    const PORT = ENV.PORT;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => console.log("❌ Error de conexión:", error));

//test endpoint
app.get("/", (req, res) => {
  res.send("¡El backend de Endangered Species está funcionando!");
});
