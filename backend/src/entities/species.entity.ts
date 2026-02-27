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
} from "typeorm";
import { Taxonomy } from "./taxonomy.entity";
import { PopulationCensus } from "./population-census.entity";
import { StatusHistory } from "./status-history.entity";
import { Region } from "./region.entity";
import { Favorite } from "./favorites.entity";
import { SpeciesMedia } from "./species-media.entity";

@Entity("species")
export class Species {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({
    name: "scientific_name",
    type: "varchar",
    length: 255,
    unique: true,
  })
  scientificName: string;

  @Column({
    name: "common_name",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  commonName: string | null;

  @Column({
    name: "iucn_status",
    type: "enum",
    enum: ["EX", "EW", "CR", "EN", "VU", "NT", "LC", "DD", "NE"],
  })
  iucnStatus: string;

  @Column({
    name: "taxonomy_id",
    type: "int",
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

  @ManyToOne(() => Taxonomy, (taxonomy) => taxonomy.species, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "taxonomy_id" })
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
