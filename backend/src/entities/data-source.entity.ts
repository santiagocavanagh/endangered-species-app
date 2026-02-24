import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  CreateDateColumn,
} from "typeorm";

export enum DataSourceType {
  IUCN = "iucn",
  WIKIPEDIA = "wikipedia",
  GOVERNMENT = "government",
  NGO = "ngo",
  RESEARCH = "research",
  DATABASE = "database",
  OTHER = "other",
}

@Entity("data_source")
@Unique("uk_data_source_name", ["name"])
export class DataSource {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: "varchar", length: 150 })
  name: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  url: string | null;

  @Column({ type: "enum", enum: DataSourceType })
  type: DataSourceType;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamp",
  })
  createdAt: Date;
}
