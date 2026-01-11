import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import speciesRoutes from "./routes/speciesRoutes";

const app = express();

app.use(cors());
app.use(express.json());
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

//Ruta de prueba
app.get("/", (req, res) => {
    res.send("¡El backend de Endangered Species está funcionando!");
});