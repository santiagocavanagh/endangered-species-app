import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Favorite } from "./favorites.entity";
import { Tendency } from "./tendency.entity";

@Entity("species")
export class Species {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  scientificName: string;

  @Column({
    type: "enum",
    enum: ["animal", "planta", "hongo"],
  })
  category: "animal" | "planta" | "hongo";

  @Column({
    type: "enum",
    enum: ["CR", "EN", "VU", "NT", "LC", "EX"],
  })
  status: "CR" | "EN" | "VU" | "NT" | "LC" | "EX";

  @Column({ default: true })
  isVisible: boolean;

  @Column({
    type: "enum",
    enum: ["America", "Europa", "Africa", "Asia", "Oceania", "Global"],
    default: "Global",
  })
  region: "America" | "Europa" | "Africa" | "Asia" | "Oceania" | "Global";

  @Column({
    type: "enum",
    enum: ["Global", "Regional"],
    default: "Global",
  })
  scope: "Global" | "Regional";

  @Column({
    type: "enum",
    enum: ["Aumento", "Descenso", "Estable", "Desconocido"],
    default: "Desconocido",
  })
  currentTrend: "Aumento" | "Descenso" | "Estable" | "Desconocido";

  @Column({ type: "text", nullable: true })
  habitat: string;

  @Column({ type: "text", nullable: true })
  population: string;

  @Column({ type: "text", nullable: true })
  imageUrl: string;

  @OneToMany(() => Tendency, (tendency) => tendency.species, { cascade: true })
  tendencyHistory: Tendency[];

  @OneToMany(() => Favorite, (favorite) => favorite.species)
  favorites: Favorite[];
}
