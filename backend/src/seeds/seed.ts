import { AppDataSource } from "../data-source";
import { Species } from "../entities/species";

const seed = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    console.log("Desactivando restricciones de llave foránea...");
    // 1. Desactivar chequeo de llaves foráneas
    await queryRunner.query("SET FOREIGN_KEY_CHECKS = 0;");

    // 2. Limpiar la tabla (ahora MySQL te dejará)
    // Usamos DELETE en lugar de TRUNCATE para ser más sutiles con las relaciones
    await queryRunner.query("DELETE FROM species;");

    // Opcional: Reiniciar el contador del ID autoincremental
    await queryRunner.query("ALTER TABLE species AUTO_INCREMENT = 1;");

    const speciesRepository = AppDataSource.getRepository(Species);

    const initialSpecies = [
      {
        name: "Tigre de Bengala",
        scientificName: "Panthera tigris tigris",
        status: "peligro",
        habitat: "Bosque",
        region: "Asia",
        population: "<2,500",
        imageUrl:
          "https://images.unsplash.com/photo-1759346673950-c24e611680c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aWdlciUyMGVuZGFuZ2VyZWQlMjBhbmltYWx8ZW58MXx8fHwxNzY4MDcxMzkyfDA&ixlib=rb-4.1.0&q=80&w=1080",
        category: "animal",
      },
      {
        name: "Oso Panda Gigante",
        scientificName: "Ailuropoda melanoleuca",
        status: "vulnerable",
        habitat: "Bosque",
        region: "Asia",
        population: "~1,864",
        imageUrl:
          "https://images.unsplash.com/photo-1723444612558-a41b25c8e896?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYW5kYSUyMGVuZGFuZ2VyZWQlMjBhbmltYWx8ZW58MXx8fHwxNzY4MDcxMzkyfDA&ixlib=rb-4.1.0&q=80&w=1080",
        category: "animal",
      },
      {
        name: "Elefante Africano",
        scientificName: "Loxodonta africana",
        status: "peligro",
        habitat: "Desierto",
        region: "África",
        population: "~415,000",
        imageUrl:
          "https://images.unsplash.com/photo-1670384628277-98c0a5f14a47?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVwaGFudCUyMGVuZGFuZ2VyZWQlMjBhbmltYWx8ZW58MXx8fHwxNzY4MDcxMzkyfDA&ixlib=rb-4.1.0&q=80&w=1080",
        category: "animal",
      },
      {
        name: "Gorila de Montaña",
        scientificName: "Gorilla beringei beringei",
        status: "critico",
        habitat: "Montaña",
        region: "África",
        population: "~1,063",
        imageUrl:
          "https://images.unsplash.com/photo-1762358511314-ac38f03cffbd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3JpbGxhJTIwZW5kYW5nZXJlZCUyMGFuaW1hbHxlbnwxfHx8fDE3NjgwNzEzOTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
        category: "animal",
      },
      {
        name: "Tortuga Marina",
        scientificName: "Cheloniidae",
        status: "critico",
        habitat: "Marino",
        region: "Oceanía",
        population: "<25,000",
        imageUrl:
          "https://images.unsplash.com/photo-1761365175714-73ac857fc43a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWElMjB0dXJ0bGUlMjBlbmRhbmdlcmVkfGVufDF8fHx8MTc2ODA3MTM5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
        category: "animal",
      },
      {
        name: "Rinoceronte de Java",
        scientificName: "Rhinoceros sondaicus",
        status: "critico",
        habitat: "Bosque",
        region: "Asia",
        population: "<75",
        imageUrl:
          "https://images.unsplash.com/photo-1670384628277-98c0a5f14a47?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVwaGFudCUyMGVuZGFuZ2VyZWQlMjBhbmltYWx8ZW58MXx8fHwxNzY4MDcxMzkyfDA&ixlib=rb-4.1.0&q=80&w=1080",
        category: "animal",
      },
    ];

    await speciesRepository.save(initialSpecies);
    console.log("✅ Datos sembrados (Seeded) con éxito");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante el seeding:", error);
    process.exit(1);
  }
};

seed();
