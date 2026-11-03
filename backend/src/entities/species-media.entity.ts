import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Species } from "./species.entity";

export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  DOCUMENT = "document",
}

@Entity("species_media")
export class SpeciesMedia {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id: number;

  @ManyToOne(() => Species, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "species_id" })
  species: Species;

  @Column({ name: "media_url", type: "varchar", length: 500 })
  mediaUrl: string;

  @Column({
    name: "media_type",
    type: "enum",
    enum: MediaType,
    default: MediaType.IMAGE,
  })
  mediaType: MediaType;

  @Column({ type: "varchar", length: 255, nullable: true })
  credit: string | null;

  @Column({ type: "varchar", length: 150, nullable: true })
  license: string | null;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamp",
  })
  createdAt: Date;
}
