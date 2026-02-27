import { AppDataSource } from "../config/data.source";
import { Taxonomy } from "../entities/taxonomy.entity";
import { Region } from "../entities/region.entity";

async function seed() {
  await AppDataSource.initialize();

  const taxonomyRepo = AppDataSource.getRepository(Taxonomy);
  const regionRepo = AppDataSource.getRepository(Region);

  const tax = taxonomyRepo.create({
    kingdom: "Animalia",
    phylum: "Chordata",
    className: "Mammalia",
    orderName: "Primates",
    family: "Hominidae",
    genus: "Homo",
  });

  const savedTax = await taxonomyRepo.save(tax);

  const region = regionRepo.create({ name: "Test Region" });
  const savedRegion = await regionRepo.save(region);

  console.log("Seed created:", {
    taxonomyId: savedTax.id,
    regionId: savedRegion.id,
  });

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
