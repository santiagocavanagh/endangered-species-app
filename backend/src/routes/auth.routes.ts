import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { AppDataSource } from "../config/data.source";
import { User } from "../entities/user.entity";
import { authenticateToken } from "../middleware/auth.middleware";
import { ENV } from "../config/env.config";
import { AuthRequest } from "../types/auth.types";

const router = Router();
const userRepository = AppDataSource.getRepository(User);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 1 hora
  max: 5, // Solo 5 cuentas por IP
  message: { error: "Intenta luego en 15 minutos." },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: "Intenta más tarde." },
});

// RUTAS
// REGISTRO
router.post(
  "/register",
  registerLimiter,
  async (req: Request, res: Response) => {
    const { email, password, role, name } = req.body;

    try {
      if (!email || !password || password.length < 8) {
        return res
          .status(400)
          .json({ error: "Email requerido y contraseña mín. 8 caracteres" });
      }

      // "user" por defecto admin se asigna por DB o ruta protegida.
      const finalRole = role === "admin" ? "user" : role || "user";

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = userRepository.create({
        email,
        name,
        password: hashedPassword,
        role: finalRole,
      });

      await userRepository.save(newUser);
      res.status(201).json({ message: "Usuario creado con éxito" });
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .json({ error: "Este correo electrónico ya está registrado" });
      }
      res.status(500).json({ error: "Error interno al crear usuario" });
    }
  },
);

// LOGIN
router.post("/login", loginLimiter, async (req: Request, res: Response) => {
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

    res.json({
      token,
      role: user.role,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor durante el login" });
  }
});

// UPDATE PROFILE
router.put(
  "/update-profile",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
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

      res.json({
        message: "Perfil actualizado correctamente",
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      res.status(500).json({ error: "Error interno al actualizar perfil" });
    }
  },
);

export default router;
