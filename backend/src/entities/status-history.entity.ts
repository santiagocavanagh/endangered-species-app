import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Species } from "./species.entity";
import { DataSource } from "./data-source.entity";

export enum ConservationStatus {
  CR = "CR",
  EN = "EN",
  VU = "VU",
  NT = "NT",
  LC = "LC",
  EX = "EX",
  EW = "EW",
}

@Entity("status_history")
export class StatusHistory {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id: number;

  @ManyToOne(() => Species, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "species_id" })
  species: Species;

  @Column({
    name: "old_status",
    type: "enum",
    enum: ConservationStatus,
  })
  oldStatus: ConservationStatus;

  @Column({
    name: "new_status",
    type: "enum",
    enum: ConservationStatus,
  })
  newStatus: ConservationStatus;

  @Column({ name: "changed_at", type: "date" })
  changedAt: string;

  @ManyToOne(() => DataSource, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "source_id" })
  source: DataSource;
}
