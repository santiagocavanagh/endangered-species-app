import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Favorite } from "./favorites";

@Entity("species")
export class Species {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  scientificName: string;

  @Column()
  status: string;

  @Column()
  habitat: string;

  @Column()
  region: string;

  @Column()
  population: string;

  @Column({ type: "text" })
  imageUrl: string;

  @Column()
  category: string;

  @OneToMany(() => Favorite, (favorite) => favorite.species)
  favorites: Favorite[];
}
