import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { AppDataSource } from "../config/data.source";
import { User, UserRole } from "../entities/user.entity";
import { ENV } from "../config/env.config";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from "../errors/http.error";
import {
  RegisterBody,
  LoginBody,
  UpdateProfileBody,
} from "../schemas/auth.schema";
import { isMysqlError } from "@/utils/db-error.util";
import { TokenPayload } from "../types/auth.types";

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);

  async register(data: RegisterBody) {
    const { email, password, name, role } = data;
    const normalizedEmail = email.trim().toLowerCase();
    const finalRole: UserRole = role ?? UserRole.USER;

    const hashedPassword = await bcrypt.hash(password, ENV.BCRYPT_ROUNDS);

    try {
      const user = this.userRepo.create({
        email: normalizedEmail,
        name: name ?? null,
        password: hashedPassword,
        role: finalRole,
      });

      await this.userRepo.save(user);

      return { message: "Usuario creado con éxito" };
    } catch (error: unknown) {
      if (isMysqlError(error) && error.code === "ER_DUP_ENTRY") {
        throw new BadRequestError("Este correo electrónico ya está registrado");
      }

      throw error;
    }
  }

  async login(data: LoginBody) {
    const { email, password } = data;

    const user = await this.userRepo.findOneBy({ email });

    if (!user) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const options: SignOptions = {
      expiresIn: ENV.JWT_EXPIRATION as SignOptions["expiresIn"],
    };

    const token = jwt.sign(payload, ENV.JWT_SECRET, options);

    return {
      token,
      role: user.role,
      email: user.email,
      name: user.name ?? null,
    };
  }

  async updateProfile(userId: number, data: UpdateProfileBody) {
    const user = await this.userRepo.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundError("Usuario no encontrado");
    }

    if (data.name !== undefined) {
      user.name = data.name;
    }

    if (data.password) {
      user.password = await bcrypt.hash(data.password, ENV.BCRYPT_ROUNDS);
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
