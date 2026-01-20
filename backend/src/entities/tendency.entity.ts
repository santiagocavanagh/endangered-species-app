import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Species } from "./species.entity";

@Entity("tendency")
export class Tendency {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "date" })
  date: string;

  @Column({ type: "bigint" })
  population: number;

  @ManyToOne(() => Species, (species) => species.tendencyHistory)
  species: Species;
}
