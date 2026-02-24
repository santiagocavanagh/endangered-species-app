import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
} from "typeorm";
import { Species } from "./species.entity";
import { DataSource } from "./data-source.entity";

@Entity("population_census")
@Unique("uk_species_date", ["species", "censusDate"])
export class PopulationCensus {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id: number;

  @ManyToOne(() => Species, (species) => species.populationCensus, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "species_id" })
  species: Species;

  @Column({ name: "census_date", type: "date" })
  censusDate: string;

  @Column({ type: "bigint" })
  population: number;

  @ManyToOne(() => DataSource, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "source_id" })
  source: DataSource;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamp",
  })
  createdAt: Date;
}
