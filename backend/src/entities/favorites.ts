import { Entity, PrimaryGeneratedColumn, ManyToOne, Unique } from "typeorm";
import { User } from "./user";
import { Species } from "./species";

@Entity("favorites")
@Unique(["user", "species"])
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.favorites)
  user: User;

  @ManyToOne(() => Species, (species) => species.favorites)
  species: Species;
}
