import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from "typeorm";
import { Species } from "./species.entity";

@Entity("taxonomy")
@Index(
  "uk_taxonomy_full",
  ["kingdom", "phylum", "className", "orderName", "family", "genus"],
  { unique: true },
)
export class Taxonomy {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: "varchar", length: 100 })
  kingdom: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  phylum: string | null;

  @Column({
    name: "class_name",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  className: string | null;

  @Column({
    name: "order_name",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  orderName: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  family: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  genus: string | null;

  @OneToMany(() => Species, (species) => species.taxonomy)
  species: Species[];
}
