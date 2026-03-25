import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/data.source";
import { User, UserRole } from "../entities/user.entity";
import { ENV } from "../config/env.config";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from "../errors/http.error";

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);

  async register(data: {
    email: string;
    password: string;
    name?: string;
    role?: UserRole;
  }) {
    const { email, password, name, role } = data;
    const finalRole: UserRole =
      role && Object.values(UserRole).includes(role) ? role : UserRole.USER;

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = this.userRepo.create({
        email,
        name,
        password: hashedPassword,
        role: finalRole,
      });

      await this.userRepo.save(user);

      return { message: "Usuario creado con éxito" };
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new BadRequestError("Este correo electrónico ya está registrado");
      }
      throw error;
    }
  }

  async login(data: { email: string; password: string }) {
    const { email, password } = data;

    const user = await this.userRepo.findOneBy({ email });

    if (!user) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      ENV.JWT_SECRET as string,
      { expiresIn: ENV.JWT_EXPIRATION as any },
    );

    return {
      token,
      role: user.role,
      email: user.email,
      name: user.name ?? null,
    };
  }

  async updateProfile(
    userId: number,
    data: { name?: string; password?: string },
  ) {
    const user = await this.userRepo.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundError("Usuario no encontrado");
    }

    if (data.name) {
      user.name = data.name;
    }

    await this.userRepo.save(user);

    return {
      message: "Perfil actualizado correctamente",
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
