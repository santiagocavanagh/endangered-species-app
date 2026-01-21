import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { AppDataSource } from "./config/data.source";
import authRoutes from "./routes/auth.routes";
import favoriteRoutes from "./routes/favorite.routes";
import speciesRoutes from "./routes/species.routes";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
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

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => console.log("❌ Error de conexión:", error));

//test endpoint
app.get("/", (req, res) => {
  res.send("¡El backend de Endangered Species está funcionando!");
});
