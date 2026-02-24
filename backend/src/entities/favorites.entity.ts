import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Species } from "./species.entity";

@Entity("favorites")
@Unique("uk_user_species", ["user", "species"])
export class Favorite {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @ManyToOne(() => User, (user) => user.favorites, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Species, (species) => species.favorites, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "species_id" })
  species: Species;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamp",
  })
  createdAt: Date;
}
