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
    type: "date",
    default: () => "CURRENT_DATE",
  })
  date: Date;

  @Column({ type: "bigint" })
  population: number;

  @ManyToOne(() => Species, (species) => species.tendencyHistory, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "id_species" })
  species: Species;
}
