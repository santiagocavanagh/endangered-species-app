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
    enum: ["animal", "planta", "hongo"],
  })
  category: "animal" | "planta" | "hongo";

  @Column({ type: "varchar", length: 255 })
  habitat: string;

  @Column({
    type: "enum",
    enum: ["CR", "EN", "VU", "NT", "LC", "EX"],
  })
  status: "CR" | "EN" | "VU" | "NT" | "LC" | "EX";

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
    enum: ["aumento", "descenso", "estable", "desconocido"],
    default: "desconocido",
  })
  currentTrend: "aumento" | "descenso" | "estable" | "desconocido";

  @Column({ name: "image_url", type: "text" })
  imageUrl: string;

  isVisible?: boolean;

  @OneToMany(() => Tendency, (tendency) => tendency.species, { cascade: true })
  tendencyHistory: Tendency[];

  @OneToMany(() => Favorite, (favorite) => favorite.species)
  favorites: Favorite[];
}
