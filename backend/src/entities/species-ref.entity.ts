import {
  Entity,
  Unique,
  Index,
  ManyToOne,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Species } from "./species.entity";

export enum ExternalProvider {
  GBIF = "gbif",
  IUCN = "iucn",
  INAT = "inaturalist",
}

export enum MatchStatus {
  AUTO = "auto",
  CONFIRMED = "confirmed",
  REVIEW_NEEDED = "review_needed",
  NOT_FOUND = "not_found",
}

@Entity("species_external_ref")
@Unique("uk_species_provider", ["speciesId", "provider"])
@Unique("uk_provider_external_id", ["provider", "externalId"])
export class SpeciesExternalRef {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Index("idx_species_id")
  @Column({ name: "species_id", type: "int", unsigned: true })
  speciesId: number;

  @ManyToOne(() => Species, { onDelete: "CASCADE" })
  @JoinColumn({ name: "species_id" })
  species: Species;

  @Column({
    type: "enum",
    enum: ExternalProvider,
  })
  provider: ExternalProvider;

  @Column({ name: "external_id", type: "varchar", length: 120 })
  externalId: string;

  @Column({
    name: "matched_name",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  matchedName: string | null;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  confidence: number | null;

  @Column({
    name: "match_status",
    type: "enum",
    enum: MatchStatus,
    default: MatchStatus.AUTO,
  })
  matchStatus: MatchStatus;

  @Column({ type: "json", nullable: true })
  meta: Record<string, unknown> | null;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;
}
