import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Favorite } from "./favorites";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  name!: string;

  @Column()
  password!: string;

  @Column({ default: "user" })
  role!: "admin" | "user";

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];
}
