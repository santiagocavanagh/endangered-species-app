import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  Unique,
  CreateDateColumn,
} from "typeorm";
import { Species } from "./species.entity";

export enum RegionType {
  CONTINENT = "continent",
  SUBREGION = "subregion",
  BIOME = "biome",
  CLIMATE = "climate",
  ECOREGION = "ecoregion",
}

@Entity("region")
@Unique("uk_region_name_type", ["name", "type"])
export class Region {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: "varchar", length: 150 })
  name: string;

  @Column({ type: "enum", enum: RegionType })
  type: RegionType;

  @ManyToOne(() => Region, (region) => region.children, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "parent_id" })
  parent: Region | null;

  @OneToMany(() => Region, (region) => region.parent)
  children: Region[];

  @ManyToMany(() => Species, (species) => species.regions)
  species: Species[];

  @CreateDateColumn({
    name: "created_at",
    type: "timestamp",
  })
  createdAt: Date;
}
