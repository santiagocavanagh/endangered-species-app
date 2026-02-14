import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { Region } from "./region.entity";
import { Tendency } from "./tendency.entity";
import { Favorite } from "./favorites.entity";
import {
  SPECIES_STATUS,
  SPECIES_CATEGORIES,
  SPECIES_TREND,
  SpeciesTrend,
  SpeciesStatus,
  SpeciesCategory,
} from "../constants/species.constants";

@Entity("species")
export class Species {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "scientific_name",
    type: "varchar",
    length: 255,
    unique: true,
  })
  scientificName: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({
    type: "enum",
    enum: SPECIES_CATEGORIES,
  })
  category: SpeciesCategory;

  @Column({ type: "varchar", length: 255 })
  habitat: string;

  @Column({
    type: "enum",
    enum: SPECIES_STATUS,
  })
  status: SpeciesStatus;

  @ManyToMany(() => Region, (region) => region.species)
  @JoinTable({
    name: "species_region",
    joinColumn: { name: "species_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "region_id", referencedColumnName: "id" },
  })
  region: Region[];

  @Column({ name: "population_value", type: "integer" })
  populationValue: number;

  @Column({
    name: "population_operator",
    type: "varchar",
    length: 5,
    nullable: true,
  })
  populationOperator: string | null;

  @Column({
    name: "current_trend",
    type: "enum",
    enum: SPECIES_TREND,
    default: "desconocido",
  })
  currentTrend: SpeciesTrend;

  @Column({ name: "image_url", type: "text" })
  imageUrl: string;

  isVisible?: boolean;

  @OneToMany(() => Tendency, (tendency) => tendency.species, { cascade: true })
  tendencyHistory: Tendency[];

  @OneToMany(() => Favorite, (favorite) => favorite.species)
  favorites: Favorite[];
}
