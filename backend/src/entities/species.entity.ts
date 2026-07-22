import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { Taxonomy } from "./taxonomy.entity";
import { PopulationCensus } from "./population-census.entity";
import { StatusHistory } from "./status-history.entity";
import { Region } from "./region.entity";
import { Favorite } from "./favorite.entity";
import { SpeciesMedia } from "./species-media.entity";
import { SpeciesExternalRef } from "./species-ref.entity";

@Entity("species")
export class Species {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Index("idx_scientific_name", { unique: true })
  @Column({
    name: "scientific_name",
    type: "varchar",
    length: 255,
  })
  scientificName: string;

  @Column({
    name: "common_name",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  commonName: string | null;

  @Index("idx_iucn_status")
  @Column({
    name: "iucn_status",
    type: "enum",
    enum: ["EX", "EW", "CR", "EN", "VU", "NT", "LC", "DD", "NE"],
  })
  iucnStatus: string;

  @Index("idx_taxonomy_id")
  @Column({
    name: "taxonomy_id",
    type: "int",
    unsigned: true,
  })
  taxonomyId: number;

  @Column({
    name: "description",
    type: "text",
    nullable: true,
  })
  description: string | null;

  @Column({
    name: "habitat",
    type: "text",
    nullable: true,
  })
  habitat: string | null;

  @OneToMany(() => PopulationCensus, (census) => census.species)
  populationCensus: PopulationCensus[];

  @OneToMany(() => StatusHistory, (history) => history.species)
  statusHistory: StatusHistory[];

  @OneToMany(() => SpeciesExternalRef, (ref) => ref.species)
  externalRefs: SpeciesExternalRef[];

  @ManyToOne(() => Taxonomy, (taxonomy) => taxonomy.species, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "taxonomy_id", referencedColumnName: "id" })
  taxonomy: Taxonomy;

  @ManyToMany(() => Region, (region) => region.species)
  @JoinTable({
    name: "species_region",
    joinColumn: {
      name: "species_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "region_id",
      referencedColumnName: "id",
    },
  })
  regions: Region[];

  @OneToMany(() => Favorite, (fav) => fav.species)
  favorites: Favorite[];

  @OneToMany(() => SpeciesMedia, (media) => media.species)
  media: SpeciesMedia[];

  @CreateDateColumn({
    name: "created_at",
    type: "timestamp",
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamp",
  })
  updatedAt: Date;
}
