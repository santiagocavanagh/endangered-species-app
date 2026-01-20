import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Favorite } from "./favorites.entity";
import { Tendency } from "./tendency.entity";

@Entity("species")
export class Species {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  scientificName: string;

  @Column({
    type: "enum",
    enum: ["America", "Europa", "Africa", "Asia", "Oceania", "Global"],
    default: "Global",
  })
  region: "America" | "Europa" | "Africa" | "Asia" | "Oceania" | "Global";

  @Column({
    type: "enum",
    enum: ["Aumento", "Descenso", "Estable", "Desconocido"],
    default: "Desconocido",
  })
  currentTrend: "Aumento" | "Descenso" | "Estable" | "Desconocido";

  @OneToMany(() => Tendency, (tendency) => tendency.species, { cascade: true })
  tendencyHistory: Tendency[];

  @Column()
  status: string;

  @Column()
  habitat: string;

  @Column()
  population: string;

  @Column({ type: "text" })
  imageUrl: string;

  @Column()
  category: string;

  @OneToMany(() => Favorite, (favorite) => favorite.species)
  favorites: Favorite[];
}
