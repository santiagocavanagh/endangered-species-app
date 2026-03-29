import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { ENV } from "../config/env.config";
import { isMysqlError } from "@/utils/db-error.util";
import { TokenPayload } from "../types/auth.types";
import { AppDataSource } from "../config/data.source";
import { User, UserRole } from "../entities/user.entity";
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

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);

  //Register
  async register(data: RegisterBody) {
    const { email, password, name, role } = data;

    const normalizedEmail = email.trim().toLowerCase();

    if (role && !Object.values(UserRole).includes(role)) {
      throw new BadRequestError("Rol inválido");
    }

    const existingUser = await this.userRepo.findOneBy({
      email: normalizedEmail,
    });

    if (existingUser) {
      throw new BadRequestError("Este correo electrónico ya está registrado");
    }

    const rounds = Number(ENV.BCRYPT_ROUNDS);

    if (!Number.isInteger(rounds) || rounds <= 0) {
      throw new Error("BCRYPT_ROUNDS inválido");
    }

    const hashedPassword = await bcrypt.hash(password, rounds);

    const finalRole: UserRole = UserRole.USER;

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

  //Login
  async login(data: LoginBody) {
    const { email, password } = data;

    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.userRepo.findOneBy({
      email: normalizedEmail,
    });

    //timing attacks
    const dummyHash =
      "$2b$10$CwTycUXWue0Thq9StjUM0uJ8p8H6Y9x8uWb1x1o1t4bm/FYnGV8e6"; // bcrypt hash válido

    const passwordToCompare = user?.password ?? dummyHash;

    const valid = await bcrypt.compare(password, passwordToCompare);

    if (!user || !valid) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      passwordChangedAt: user.passwordChangedAt?.getTime() ?? 0,
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

  //Update
  async updateProfile(userId: number, data: UpdateProfileBody) {
    const user = await this.userRepo.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundError("Usuario no encontrado");
    }

    let updated = false;

    if (data.name !== undefined) {
      const normalizedName = data.name.trim();

      user.name = normalizedName.length > 0 ? normalizedName : null;
      updated = true;
    }

    const rounds = Number(ENV.BCRYPT_ROUNDS);
    if (!Number.isInteger(rounds) || rounds <= 0) {
      throw new Error("BCRYPT_ROUNDS inválido");
    }

    if (data.password) {
      if (!data.currentPassword) {
        throw new UnauthorizedError("Debe ingresar la contraseña actual");
      }

      const valid = await bcrypt.compare(data.currentPassword, user.password);

      if (!valid) {
        throw new UnauthorizedError("Contraseña actual incorrecta");
      }

      user.password = await bcrypt.hash(data.password, rounds);

      user.passwordChangedAt = new Date();

      updated = true;
    }

    return {
      message: updated ? "Perfil actualizado correctamente" : "Sin cambios",
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
