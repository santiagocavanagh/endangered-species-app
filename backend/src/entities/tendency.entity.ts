import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Species } from "./species.entity";

@Entity("tendency")
export class Tendency {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "census_date",
    type: "date",
  })
  censusDate: Date;

  @Column({
    type: "bigint",
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  population: number;

  @ManyToOne(() => Species, (species) => species.tendencyHistory, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "id_species" })
  species: Species;
}
