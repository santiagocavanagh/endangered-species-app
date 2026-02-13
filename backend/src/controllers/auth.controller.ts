import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/data.source";
import { User } from "../entities/user.entity";
import { ENV } from "../config/env.config";

const userRepository = AppDataSource.getRepository(User);

export class AuthController {
  // Registro de usuario
  static register = async (req: Request, res: Response) => {
    const { email, password, role, name } = req.body;
    try {
      if (!email || !password || password.length < 8) {
        return res
          .status(400)
          .json({ error: "Email requerido y contraseña mín. 8 caracteres" });
      }
      const finalRole = role === "admin" ? "user" : role || "user";
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = userRepository.create({
        email,
        name,
        password: hashedPassword,
        role: finalRole,
      });

      await userRepository.save(newUser);
      return res.status(201).json({ message: "Usuario creado con éxito" });
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .json({ error: "Este correo electrónico ya está registrado" });
      }
      return res.status(500).json({ error: "Error interno al crear usuario" });
    }
  };

  // Login de usuario
  static login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
      const user = await userRepository.findOneBy({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        ENV.JWT_SECRET as string,
        { expiresIn: ENV.JWT_EXPIRATION as any },
      );

      return res.json({
        token,
        role: user.role,
        email: user.email,
        name: user.name,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Error en el servidor durante el login" });
    }
  };

  // Actualizar perfil
  static updateProfile = async (req: any, res: Response) => {
    const { name, password } = req.body;
    const userId = req.user?.id;
    try {
      const user = await userRepository.findOneBy({ id: userId });
      if (!user)
        return res.status(404).json({ error: "Usuario no encontrado" });

      if (name) user.name = name;
      if (password) {
        if (password.trim().length < 8) {
          return res.status(400).json({
            error: "La nueva contraseña debe tener mín. 8 caracteres",
          });
        }
        user.password = await bcrypt.hash(password, 10);
      }
      await userRepository.save(user);
      return res.json({
        message: "Perfil actualizado correctamente",
        user: { name: user.name, email: user.email, role: user.role },
      });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Error interno al actualizar perfil" });
    }
  };
}
