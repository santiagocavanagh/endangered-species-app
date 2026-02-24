import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  Unique,
} from "typeorm";
import { Favorite } from "./favorites.entity";

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

@Entity("users")
@Unique("uk_users_email", ["email"])
export class User {
  @PrimaryGeneratedColumn({ unsigned: true })
  id!: number;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", length: 150, nullable: true })
  name!: string | null;

  @Column({ type: "varchar", length: 255 })
  password!: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamp",
  })
  createdAt!: Date;

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites!: Favorite[];
}
