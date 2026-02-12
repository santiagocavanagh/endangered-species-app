import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Species } from "./species.entity";

@Entity("region")
export class Region {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 100, unique: true })
  name: string;

  @ManyToMany(() => Species, (species) => species.region)
  species: Species[];
}
