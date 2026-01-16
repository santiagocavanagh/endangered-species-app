import { Router } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/user";
import { authenticateToken } from "../middleware/authMiddleware";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET as string;

router.post("/register", async (req, res) => {
  const { email, password, role } = req.body;
  const userRepository = AppDataSource.getRepository(User);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = userRepository.create({
      email,
      password: hashedPassword,
      role: role || "user",
    });
    await userRepository.save(newUser);
    res.status(201).json({ message: "Usuario creado" });
  } catch (error) {
    res.status(400).json({ error: "El email ya existe" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOneBy({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "1d",
  });
  res.json({ token, role: user.role, email: user.email });
});

router.put("/update-profile", authenticateToken, async (req, res) => {
  const { name, password } = req.body;
  const userId = (req as any).user.id;

  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    if (name) user.name = name;

    if (password) {
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
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
